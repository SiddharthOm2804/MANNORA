import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { getDbStatus } from '../src/config/db.js';

describe('Server & Health API', () => {
  test('Root endpoint returns Phase 1 metadata', async () => {
    // Test app request handler via native fetch or node http
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.name, 'NEURAL CITY API');
      assert.ok(json.phase.includes('NEURAL CITY') || json.phase.includes('Phase'));
    } finally {
      server.close();
    }
  });

  test('GET /api/health exposes server status, db status, and timestamp', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/health`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.ok(['healthy', 'degraded'].includes(json.status));
      assert.ok(json.timestamp);
      assert.ok(json.server);
      assert.equal(json.server.status, 'running');
      assert.ok(json.database);
      assert.ok('isConnected' in json.database);
      assert.ok(json.engine);
    } finally {
      server.close();
    }
  });
});
