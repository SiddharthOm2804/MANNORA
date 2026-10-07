import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { World } from '../src/models/World.js';
import { eventPublisher } from '../src/services/eventPublisher.js';
import { SimulationEngine } from '@neural-city/simulation';

describe('Real-Time SSE Event Channel', () => {
  let server;
  let port;
  let testWorld;
  let testWorldId;

  before(async () => {
    await connectDB();
    server = app.listen(0);
    port = server.address().port;

    testWorld = await World.create({
      name: 'Realtime Telemetry Test Basin',
      description: 'World for SSE telemetry verification',
      population: 5000,
    });
    testWorldId = testWorld._id.toString();
  });

  after(async () => {
    eventPublisher.clear();
    if (testWorldId) {
      await World.findByIdAndDelete(testWorldId);
    }
    server.close();
    await disconnectDB();
  });

  test('GET /api/worlds/:id/events establishes SSE connection with CONNECTED frame', async () => {
    const receivedChunks = [];

    await new Promise((resolve, reject) => {
      const req = http.get(
        `http://localhost:${port}/api/worlds/${testWorldId}/events`,
        (res) => {
          assert.equal(res.statusCode, 200);
          assert.match(res.headers['content-type'], /text\/event-stream/);
          assert.match(res.headers['cache-control'], /no-cache/);

          res.on('data', (chunk) => {
            const text = chunk.toString();
            receivedChunks.push(text);

            if (text.includes('CONNECTED')) {
              req.destroy();
              resolve();
            }
          });

          res.on('error', reject);
        }
      );

      req.on('error', (err) => {
        // req.destroy() causes an error which we can ignore once resolved
        if (receivedChunks.length === 0) reject(err);
      });
    });

    const fullResponse = receivedChunks.join('');
    assert.ok(fullResponse.includes('CONNECTED'));
    assert.ok(fullResponse.includes(testWorldId));
    assert.ok(fullResponse.includes('Realtime Telemetry Test Basin'));
  });

  test('EventPublisher dispatches formatted simulation events to connected SSE client', async () => {
    const receivedEvents = [];

    await new Promise((resolve, reject) => {
      const req = http.get(
        `http://localhost:${port}/api/worlds/${testWorldId}/events`,
        (res) => {
          res.on('data', (chunk) => {
            const text = chunk.toString();
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  receivedEvents.push(parsed);

                  if (parsed.type === 'TEST_ALERT') {
                    req.destroy();
                    resolve();
                  }
                } catch {
                  // Ignore keepalives or incomplete chunks
                }
              }
            }
          });
        }
      );

      req.on('error', () => {});

      // Wait 50ms for connection to establish, then publish event
      setTimeout(() => {
        eventPublisher.publish(testWorldId, {
          type: 'TEST_ALERT',
          tick: 42,
          payload: { notice: 'Atmospheric pressure stabilized' },
        });
      }, 60);
    });

    const testAlert = receivedEvents.find((e) => e.type === 'TEST_ALERT');
    assert.ok(testAlert);
    assert.equal(testAlert.worldId, testWorldId);
    assert.equal(testAlert.tick, 42);
    assert.equal(testAlert.payload.notice, 'Atmospheric pressure stabilized');
  });

  test('SimulationEngine events seamlessly bridge to EventPublisher', () => {
    const engine = new SimulationEngine({ seed: 9999 });
    const received = [];

    const unbind = eventPublisher.bindSimulationEngine('test-world-engine', engine);
    const unsub = eventPublisher.subscribe('test-world-engine', (evt) => {
      received.push(evt);
    });

    engine.init();
    engine.step();

    assert.ok(received.some((e) => e.type === 'STATUS_CHANGE'));
    assert.ok(received.some((e) => e.type === 'TICK' && e.tick === 1));

    unsub();
    unbind();
  });

  test('Rejects SSE connection on invalid World ID (400) and missing World (404)', async () => {
    const resInvalid = await fetch(`http://localhost:${port}/api/worlds/invalid-id/events`);
    assert.equal(resInvalid.status, 400);

    const resMissing = await fetch(`http://localhost:${port}/api/worlds/507f1f77bcf86cd799439011/events`);
    assert.equal(resMissing.status, 404);
  });
});
