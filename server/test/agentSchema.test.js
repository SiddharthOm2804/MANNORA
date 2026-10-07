import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { World } from '../src/models/World.js';
import { Agent } from '../src/models/Agent.js';

describe('Agent State Schema & Persistence Foundation', () => {
  let testWorldId;
  let createdAgentDocId;

  before(async () => {
    await connectDB();
    // Create a parent world for agent association
    const testWorld = await World.create({
      name: 'Agent Test Habitat Sector',
      description: 'Habitat for validating agent state schema',
      population: 100,
    });
    testWorldId = testWorld._id;
  });

  after(async () => {
    if (createdAgentDocId) {
      await Agent.findByIdAndDelete(createdAgentDocId);
    }
    if (testWorldId) {
      await Agent.deleteMany({ worldId: testWorldId });
      await World.findByIdAndDelete(testWorldId);
    }
    await disconnectDB();
  });

  test('Creates Agent with valid identity, traits, state, and memory records', async () => {
    const agentData = {
      agentId: 'agt_test_001',
      worldId: testWorldId,
      name: 'Dr. Lysander Vance',
      role: 'OBSERVER',
      state: {
        status: 'active',
        health: 98,
        happiness: 90,
        energy: 85,
        wealth: 1250,
        currentAction: 'OBSERVING_ENERGY_GRID',
        location: {
          x: 42,
          y: 68,
          sector: 'Sector-02 // Power Hub',
        },
      },
      traits: {
        rationality: 0.92,
        ambition: 0.75,
        riskTolerance: 0.3,
        socialAffinity: 0.6,
        productivity: 0.88,
      },
      memoryRecords: [
        {
          memoryId: 'mem_001',
          event: 'Witnessed solar collector calibration anomaly.',
          importance: 0.85,
          tick: 42,
          metadata: { subsystem: 'energy_grid' },
        },
        {
          memoryId: 'mem_002',
          event: 'Attended municipal assembly.',
          importance: 0.4,
          tick: 55,
        },
      ],
    };

    const agent = await Agent.create(agentData);
    assert.ok(agent._id);
    assert.equal(agent.agentId, 'agt_test_001');
    assert.equal(agent.worldId.toString(), testWorldId.toString());
    assert.equal(agent.name, 'Dr. Lysander Vance');
    assert.equal(agent.role, 'OBSERVER');
    assert.equal(agent.state.health, 98);
    assert.equal(agent.state.location.sector, 'Sector-02 // Power Hub');
    assert.equal(agent.traits.rationality, 0.92);
    assert.equal(agent.memoryRecords.length, 2);
    assert.equal(agent.memoryCount, 2);
    assert.ok(agent.createdAt);
    assert.ok(agent.updatedAt);

    createdAgentDocId = agent._id;
  });

  test('Rejects Agent without required agentId or worldId', async () => {
    await assert.rejects(
      async () => {
        await Agent.create({
          name: 'Nameless Unit',
        });
      },
      /required/i
    );
  });

  test('Validates trait values within [0, 1] range', async () => {
    await assert.rejects(
      async () => {
        await Agent.create({
          agentId: 'agt_invalid_traits',
          worldId: testWorldId,
          name: 'Invalid Trait Agent',
          traits: {
            rationality: 1.5, // Exceeds max 1.0
          },
        });
      },
      /Trait values must be between 0 and 1/i
    );
  });

  test('Applies sensible defaults for state and traits when omitted', async () => {
    const minimalAgent = await Agent.create({
      agentId: 'agt_minimal_002',
      worldId: testWorldId,
      name: 'Citizen Minimal',
    });

    assert.equal(minimalAgent.role, 'CITIZEN');
    assert.equal(minimalAgent.state.health, 100);
    assert.equal(minimalAgent.state.happiness, 100);
    assert.equal(minimalAgent.state.wealth, 50);
    assert.equal(minimalAgent.traits.rationality, 0.5);
    assert.equal(minimalAgent.traits.productivity, 0.5);
    assert.deepEqual(minimalAgent.memoryRecords, []);
    assert.equal(minimalAgent.memoryCount, 0);

    await Agent.findByIdAndDelete(minimalAgent._id);
  });
});
