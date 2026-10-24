import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('Phase 9: Server AI Assistant Endpoints (/api/ai)', () => {
  it('POST /api/ai/citizen/:id/reflect returns structured reflection via AI layer', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/ai/citizen/agt_101/reflect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Tarek Chen',
          role: 'engineer',
          citizenState: { occupation: 'engineer', wealth: 180, healthState: { health: 90 } },
          worldContext: { tick: 60 },
        }),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.citizenId, 'agt_101');
      assert.ok(json.data.reflection, 'Response should contain personal reflection');
      assert.ok(json.data.source, 'Response should indicate AI execution source');
    } finally {
      server.close();
    }
  });

  it('POST /api/ai/citizen/:id/memory commits high-impact milestone event', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/ai/citizen/agt_101/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone: {
            type: 'job_change',
            description: 'Promoted to Lead Grid Engineer at Sector 02 Power Core',
            importance: 0.85,
            tick: 45,
          },
        }),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.wasCommitted, true);
      assert.strictEqual(json.data.type, 'job_change');
    } finally {
      server.close();
    }
  });

  it('POST /api/ai/government/evaluate returns policy recommendations', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/ai/government/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: {
            population: 1500,
            stability: 75,
            happiness: 80,
            crimeRate: 5,
            treasury: 48000,
            taxRate: 0.16,
          },
        }),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.data.recommendations));
      assert.ok(json.data.assessment);
    } finally {
      server.close();
    }
  });

  it('POST /api/ai/analyst/diagnostics returns systemic civilization diagnostics', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/ai/analyst/diagnostics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: { population: 1500, health: 92, happiness: 85 },
          economy: { gdp: 160000, inflationRate: 0.021, treasury: 54000 },
          social: { harmonyIndex: 82, networkDensity: 0.38 },
        }),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.executiveSummary);
      assert.ok(typeof json.data.systemHealthScore === 'number');
    } finally {
      server.close();
    }
  });
});
