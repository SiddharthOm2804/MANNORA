import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { World } from '../src/models/World.js';

describe('World Creation & Management API (with Error Refinement)', () => {
  let server;
  let baseUrl;
  let createdWorldId;

  before(async () => {
    await connectDB();
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/worlds`;
  });

  after(async () => {
    // Cleanup created test documents
    if (createdWorldId) {
      await World.findByIdAndDelete(createdWorldId);
    }
    server.close();
    await disconnectDB();
  });

  test('1. Valid request: POST /api/worlds creates a structured virtual civilization', async () => {
    const payload = {
      name: 'Test Sector 99 // Nova Prime',
      description: 'Automated test civilization for Phase 3 validation.',
      population: 2500,
      numberOfCities: 4,
      biome: 'Cybernetic Basin',
      startingMoney: 750000,
      industries: ['Energy', 'Advanced Technology', 'Quantum Logistics'],
      governmentType: 'Technocracy',
      simulationSpeed: 2,
      startingDate: '2085-06-01T00:00:00.000Z',
      resources: {
        energy: 8000,
        minerals: 4000,
        water: 6000,
        agriculture: 3500,
        technology: 1500,
      },
    };

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const json = await res.json();

    assert.equal(json.success, true);
    assert.ok(json.data._id);
    assert.equal(json.data.name, payload.name);
    assert.equal(json.data.population, 2500);
    assert.equal(json.data.cities.length, 4);
    assert.equal(json.data.cities[0].isCapital, true);
    assert.equal(json.data.economyConfiguration.startingMoney, 750000);
    assert.equal(json.data.governmentConfiguration.type, 'Technocracy');
    assert.equal(json.data.simulationSettings.speed, 2);

    createdWorldId = json.data._id;
  });

  test('GET /api/worlds returns list of created worlds', async () => {
    const res = await fetch(baseUrl);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.some((w) => w._id === createdWorldId));
  });

  test('GET /api/worlds/:id returns single world details', async () => {
    const res = await fetch(`${baseUrl}/${createdWorldId}`);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.success, true);
    assert.equal(json.data._id, createdWorldId);
    assert.equal(json.data.name, 'Test Sector 99 // Nova Prime');
  });

  test('PATCH /api/worlds/:id updates world parameters', async () => {
    const updatePayload = {
      population: 3200,
      'simulationSettings.speed': 5,
    };

    const res = await fetch(`${baseUrl}/${createdWorldId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.success, true);
    assert.equal(json.data.population, 3200);
    assert.equal(json.data.simulationSettings.speed, 5);
  });

  test('2. Validation failure: rejects creation when name is missing or invalid', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ population: 500 }),
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /name is required/i);
  });

  test('2. Validation failure: rejects invalid numeric range on PATCH', async () => {
    const res = await fetch(`${baseUrl}/${createdWorldId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ population: -50 }),
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  test('3. Invalid ID: returns HTTP 400 for malformed Mongo ObjectID', async () => {
    const resGet = await fetch(`${baseUrl}/invalid-hex-id-999`);
    assert.equal(resGet.status, 400);
    const jsonGet = await resGet.json();
    assert.equal(jsonGet.success, false);
    assert.match(jsonGet.message, /Invalid World ID/i);

    const resPatch = await fetch(`${baseUrl}/invalid-hex-id-999`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ population: 2000 }),
    });
    assert.equal(resPatch.status, 400);

    const resDelete = await fetch(`${baseUrl}/invalid-hex-id-999`, {
      method: 'DELETE',
    });
    assert.equal(resDelete.status, 400);
  });

  test('4. Missing world: returns HTTP 404 for valid ObjectID of non-existent world', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011';

    const resGet = await fetch(`${baseUrl}/${nonExistentId}`);
    assert.equal(resGet.status, 404);
    const jsonGet = await resGet.json();
    assert.equal(jsonGet.success, false);

    const resPatch = await fetch(`${baseUrl}/${nonExistentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ population: 2000 }),
    });
    assert.equal(resPatch.status, 404);

    const resDelete = await fetch(`${baseUrl}/${nonExistentId}`, {
      method: 'DELETE',
    });
    assert.equal(resDelete.status, 404);
  });

  test('5. DELETE /api/worlds/:id deletes the world successfully', async () => {
    const res = await fetch(`${baseUrl}/${createdWorldId}`, {
      method: 'DELETE',
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);

    // Verify it is gone
    const verifyRes = await fetch(`${baseUrl}/${createdWorldId}`);
    assert.equal(verifyRes.status, 404);
    createdWorldId = null; // Mark cleaned up
  });
});
