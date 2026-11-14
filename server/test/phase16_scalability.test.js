import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { WebSocket } from 'ws';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { webSocketGateway } from '../src/services/webSocketGateway.js';
import { deltaCompressor } from '../src/services/deltaCompressor.js';
import { cacheManager } from '../src/services/cacheManager.js';
import { persistenceWorker } from '../src/services/persistenceWorker.js';
import { eventPublisher } from '../src/services/eventPublisher.js';
import { World } from '../src/models/World.js';
import { User } from '../src/models/User.js';
import { AuthSession } from '../src/models/AuthSession.js';
import { createAuthClient } from './helpers/authClient.js';

describe('Phase 16: Scalability Engine (WebSockets, Delta Compression, Caching, Batch Workers)', () => {
  let server;
  let serverPort;
  let auth;
  let testWorld;

  before(async () => {
    await connectDB();
    server = http.createServer(app);
    webSocketGateway.attach(server);
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        resolve();
      });
    });
    auth = await createAuthClient(`http://localhost:${serverPort}/api`);
    testWorld = await World.create({ ownerId: auth.user.id, name: 'Realtime Access Test World', population: 900 });
  });

  after(async () => {
    webSocketGateway.close();
    await persistenceWorker.stop();
    await cacheManager.disconnect();
    if (testWorld?._id) await World.findByIdAndDelete(testWorld._id);
    await AuthSession.deleteMany({ userId: auth?.user.id });
    await User.findByIdAndDelete(auth?.user.id);
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  });

  test('DeltaCompressor emits KEYFRAME initially and sparse DELTA thereafter', () => {
    const worldId = 'test-world-123';
    deltaCompressor.resetWorld(worldId);

    const fullState1 = {
      tick: 1,
      population: { total: 1000, employed: 700 },
      resources: { energy: 5000, water: 4990 },
      economy: { treasury: 50000, gdp: 120000 },
      metrics: { averageHealth: 90, averageSatisfaction: 85 },
      agents: [
        { id: 'agt_1', location: { x: 50, y: 50 }, currentAction: 'WORKING', healthState: { health: 95 } },
        { id: 'agt_2', location: { x: 52, y: 51 }, currentAction: 'RESTING', healthState: { health: 80 } },
      ],
    };

    // 1st tick: keyframe
    const frame1 = deltaCompressor.computeDelta(worldId, fullState1);
    assert.equal(frame1.type, 'KEYFRAME');
    assert.equal(frame1.isKeyframe, true);
    assert.equal(frame1.tick, 1);

    // 2nd tick: only water consumed and agent 1 moved
    const fullState2 = {
      tick: 2,
      population: { total: 1000, employed: 700 },
      resources: { energy: 5000, water: 4980 }, // changed
      economy: { treasury: 50000, gdp: 120000 }, // untouched
      metrics: { averageHealth: 90, averageSatisfaction: 85 },
      agents: [
        { id: 'agt_1', location: { x: 51, y: 50 }, currentAction: 'WORKING', healthState: { health: 95 } },
        { id: 'agt_2', location: { x: 52, y: 51 }, currentAction: 'RESTING', healthState: { health: 80 } },
      ],
    };

    const delta2 = deltaCompressor.computeDelta(worldId, fullState2);
    assert.equal(delta2.type, 'DELTA');
    assert.equal(delta2.isKeyframe, false);
    assert.equal(delta2.tick, 2);
    assert.ok(delta2.changes.resources);
    assert.equal(delta2.changes.resources.water, 4980);
    // Unchanged resources (energy) should not be sent
    assert.equal(delta2.changes.resources.energy, undefined);
    // Unchanged economy should not be sent
    assert.equal(delta2.changes.economy, undefined);
  });

  test('WebSocketGateway establishes connection, subscribes to world, and receives deltas', async () => {
    const worldId = String(testWorld._id);
    const ws = new WebSocket(`ws://localhost:${serverPort}/ws/simulation?worldId=${worldId}&deltasOnly=true`, { headers: { Cookie: auth.cookie, Origin: 'http://localhost:5173' } });

    const messages = [];
    ws.on('message', (raw) => {
      messages.push(JSON.parse(raw.toString()));
    });

    await new Promise((resolve) => ws.on('open', resolve));

    // Wait for initial CONNECTED message
    await new Promise((r) => setTimeout(r, 50));
    assert.ok(messages.some((m) => m.type === 'CONNECTED'));

    // Subscription is checked again after the authenticated handshake.
    ws.send(JSON.stringify({
      type: 'SUBSCRIBE_WORLD',
      worldId,
      sendDeltasOnly: true,
    }));

    await new Promise((r) => setTimeout(r, 50));
    assert.ok(messages.some((m) => m.type === 'SUBSCRIBED' && m.worldId === worldId));

    // Simulate tick emission via eventPublisher
    eventPublisher.publish(worldId, {
      type: 'TICK',
      tick: 10,
      payload: {
        delta: 1,
        simulatedTime: new Date().toISOString(),
        state: {
          tick: 10,
          resources: { energy: 4800, water: 4900 },
          economy: { treasury: 52000 },
          population: { total: 1050 },
          metrics: { averageHealth: 92 },
          agents: [],
        },
      },
    });

    await new Promise((r) => setTimeout(r, 50));
    const deltaMsg = messages.find((m) => m.type === 'KEYFRAME' || m.type === 'TICK_DELTA');
    assert.ok(deltaMsg, 'Should receive compressed frame over WebSocket');
    assert.equal(deltaMsg.worldId, worldId);

    ws.close();
  });

  test('WebSocket rejects a connection without a session', async () => {
    const ws = new WebSocket(`ws://localhost:${serverPort}/ws/simulation?worldId=${testWorld._id}`, { headers: { Origin: 'http://localhost:5173' } });
    ws.on('error', () => {});
    const code = await new Promise((resolve) => ws.once('close', (closeCode) => resolve(closeCode)));
    assert.equal(code, 1006);
  });

  test('CacheManager sets, retrieves, and handles expiry gracefully', async () => {
    await cacheManager.init();

    await cacheManager.set('test:key', { foo: 'bar', num: 42 }, 10);
    const value = await cacheManager.get('test:key');
    assert.deepEqual(value, { foo: 'bar', num: 42 });

    await cacheManager.del('test:key');
    const deleted = await cacheManager.get('test:key');
    assert.equal(deleted, null);
  });

  test('PersistenceWorker queues writes and flushes atomically', async () => {
    const worldId = testWorld._id.toString();
    persistenceWorker.queueWorldUpdate(worldId, { 'metrics.population': 1500 });
    persistenceWorker.queueAgentBatch(worldId, [
      { id: 'agt_99', name: 'Tester', wealth: 500, location: { x: 10, y: 20 } },
    ]);
    persistenceWorker.queueSnapshot({
      worldId: '507f1f77bcf86cd799439011',
      tick: 50,
      label: 'test_snapshot',
      metrics: { population: 1500 },
    });

    // Flush should execute without throwing errors
    await persistenceWorker.flush();
    assert.equal(persistenceWorker.pendingWorldUpdates.size, 0);
    assert.equal(persistenceWorker.pendingAgentUpdates.size, 0);
    assert.equal(persistenceWorker.pendingSnapshots.length, 0);
  });
});
