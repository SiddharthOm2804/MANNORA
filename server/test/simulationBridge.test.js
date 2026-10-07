import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { World } from '../src/models/World.js';
import { WorldStateAdapter } from '../src/services/worldStateAdapter.js';
import { simulationBridgeService } from '../src/services/simulationBridgeService.js';
import { WorldState } from '@neural-city/simulation';

describe('Simulation Engine → MongoDB Database Bridge', () => {
  let server;
  let baseUrl;
  let testWorld;
  let testWorldId;

  before(async () => {
    await connectDB();
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/worlds`;

    testWorld = await World.create({
      name: 'Bridge Validation Citadel',
      description: 'World created for testing DB to WorldState simulation bridge',
      population: 4000,
      cities: [
        {
          name: 'Citadel Prime',
          population: 2000,
          isCapital: true,
          coordinates: { x: 50, y: 50 },
          specialization: 'Central Command',
        },
        {
          name: 'Port Zenith',
          population: 2000,
          isCapital: false,
          coordinates: { x: 80, y: 30 },
          specialization: 'Energy Harvesting',
        },
      ],
      resources: {
        energy: 12000,
        minerals: 6000,
        water: 7500,
        agriculture: 4500,
        technology: 3000,
      },
      simulationSettings: {
        speed: 2,
        tickRate: 15,
        seed: 777888999,
        currentTick: 0,
        status: 'initialized',
      },
    });
    testWorldId = testWorld._id.toString();
  });

  after(async () => {
    await simulationBridgeService.stopWorldSimulation(testWorldId, false);
    if (testWorldId) {
      await World.findByIdAndDelete(testWorldId);
    }
    server.close();
    await disconnectDB();
  });

  test('WorldStateAdapter converts MongoDB World to JS WorldState representation', () => {
    const worldState = WorldStateAdapter.fromMongoWorld(testWorld);

    assert.ok(worldState instanceof WorldState);
    assert.equal(worldState.tick, 0);
    assert.equal(worldState.metrics.population, 4000);
    assert.equal(worldState.metrics.energy, 12000);
    assert.equal(worldState.metrics.minerals, 6000);
    assert.equal(worldState.metadata.name, 'Bridge Validation Citadel');
    assert.equal(worldState.metadata.seed, 777888999);
    assert.equal(worldState.getEntityCount(), 2);

    const entities = worldState.getEntities();
    assert.ok(entities.some((e) => e.name === 'Citadel Prime' && e.isCapital === true));
    assert.ok(entities.some((e) => e.name === 'Port Zenith'));
  });

  test('POST /api/worlds/:id/launch initializes in-memory SimulationEngine from MongoDB World', async () => {
    const res = await fetch(`${baseUrl}/${testWorldId}/launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoStart: false }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.success, true);
    assert.equal(json.data.worldId, testWorldId);
    assert.equal(json.data.status.isInitialized, true);
    assert.equal(json.data.status.seed, 777888999);
    assert.equal(json.data.status.stateSummary.entitiesCount, 2);
  });

  test('POST /api/worlds/:id/step deterministically steps simulation without DB write on every tick', async () => {
    const res = await fetch(`${baseUrl}/${testWorldId}/step`, {
      method: 'POST',
    });

    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.success, true);
    assert.equal(json.data.tick, 1);

    // Verify DB still holds 0 (no excessive write)
    const dbWorld = await World.findById(testWorldId);
    assert.equal(dbWorld.simulationSettings.currentTick, 0);
  });

  test('POST /api/worlds/:id/checkpoint commits current simulation state to MongoDB', async () => {
    // Step another tick
    await fetch(`${baseUrl}/${testWorldId}/step`, { method: 'POST' });

    const res = await fetch(`${baseUrl}/${testWorldId}/checkpoint`, {
      method: 'POST',
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.tick, 2);

    // Verify DB now holds tick 2
    const dbWorld = await World.findById(testWorldId);
    assert.equal(dbWorld.simulationSettings.currentTick, 2);
  });

  test('POST /api/worlds/:id/launch returns 404 for nonexistent world', async () => {
    const res = await fetch(`${baseUrl}/507f1f77bcf86cd799439011/launch`, {
      method: 'POST',
    });

    assert.equal(res.status, 404);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  test('POST /api/worlds/:id/launch returns 400 for malformed world ID', async () => {
    const res = await fetch(`${baseUrl}/malformed-id/launch`, {
      method: 'POST',
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  test('POST /api/worlds/:id/stop stops active simulation cleanly', async () => {
    const res = await fetch(`${baseUrl}/${testWorldId}/stop`, {
      method: 'POST',
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);

    const active = simulationBridgeService.getActiveSimulation(testWorldId);
    assert.equal(active, null);
  });
});
