import { SimulationEngine } from '@neural-city/simulation';
import { World } from '../models/World.js';
import { worldService } from './worldService.js';
import { WorldStateAdapter } from './worldStateAdapter.js';
import { eventPublisher } from './eventPublisher.js';
import { isValidMongoId } from '../utils/validators.js';

/**
 * SimulationBridgeService manages the lifecycle of in-memory SimulationEngine instances
 * backed by persistent MongoDB World entities.
 */
export class SimulationBridgeService {
  constructor() {
    /** @type {Map<string, { engine: SimulationEngine, worldId: string, unbind: Function, worldDoc: Object }>} */
    this.activeSimulations = new Map();
  }

  /**
   * Launch and initialize a simulation for a specific MongoDB World.
   * @param {string} worldId
   * @param {Object} [options]
   * @param {boolean} [options.autoStart=false]
   * @returns {Promise<{ worldId: string, worldState: Object, status: Object }>}
   */
  async launchWorldSimulation(worldId, options = {}) {
    if (!isValidMongoId(worldId)) {
      const error = new Error(`Invalid World ID format: ${worldId}`);
      error.name = 'CastError';
      error.status = 400;
      throw error;
    }

    // 1. Load world from database
    const worldDoc = await worldService.getWorldById(worldId);
    if (!worldDoc) {
      const error = new Error(`World with ID ${worldId} not found`);
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 2. If simulation is already active, return current status
    if (this.activeSimulations.has(worldId)) {
      const existing = this.activeSimulations.get(worldId);
      return {
        worldId,
        worldState: existing.engine.stateManager.getCurrentState().serialize(),
        status: existing.engine.getStatus(),
        alreadyRunning: true,
      };
    }

    // 3. Convert MongoDB World to in-memory WorldState
    let initialWorldState;
    try {
      initialWorldState = WorldStateAdapter.fromMongoWorld(worldDoc);
    } catch (err) {
      const error = new Error(`Failed to initialize WorldState from MongoDB data: ${err.message}`);
      error.name = 'ValidationError';
      error.status = 400;
      throw error;
    }

    // 4. Instantiate and configure SimulationEngine
    const engine = new SimulationEngine({
      seed: worldDoc.simulationSettings?.seed || 123456789,
      tickRate: worldDoc.simulationSettings?.tickRate || 10,
      timeScale: worldDoc.simulationSettings?.speed || 1.0,
      maxHistory: 200,
    });

    // 5. Initialize engine with the adapted state
    engine.init({
      metadata: initialWorldState.metadata,
      dimensions: initialWorldState.dimensions,
      metrics: initialWorldState.metrics,
    });

    // Load initial entities and commit full state
    for (const entity of initialWorldState.getEntities()) {
      engine.stateManager.getCurrentState().setEntity(entity.id, entity);
    }

    // 6. Bind engine events to EventPublisher for real-time SSE streaming
    const unbind = eventPublisher.bindSimulationEngine(worldId, engine);

    // 7. Store active simulation instance
    this.activeSimulations.set(worldId, {
      engine,
      worldId,
      unbind,
      worldDoc,
      launchedAt: new Date(),
    });

    // 8. Update World status in DB to 'running' or 'initialized'
    await World.findByIdAndUpdate(worldId, {
      'simulationSettings.status': options.autoStart ? 'running' : 'initialized',
    });

    if (options.autoStart) {
      engine.start();
    }

    return {
      worldId,
      worldState: engine.stateManager.getCurrentState().serialize(),
      status: engine.getStatus(),
      alreadyRunning: false,
    };
  }

  /**
   * Advance active simulation by one step
   * @param {string} worldId
   */
  stepSimulation(worldId) {
    const sim = this.activeSimulations.get(worldId);
    if (!sim) {
      const error = new Error(`Simulation for world ${worldId} is not running`);
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const nextState = sim.engine.step();
    return {
      tick: nextState.tick,
      worldState: nextState.serialize(),
      status: sim.engine.getStatus(),
    };
  }

  /**
   * Save discrete checkpoint from in-memory simulation back to MongoDB.
   * Defined persistence boundary — does not write on every tick.
   * @param {string} worldId
   */
  async saveSimulationCheckpoint(worldId) {
    const sim = this.activeSimulations.get(worldId);
    if (!sim) {
      const error = new Error(`Simulation for world ${worldId} is not running`);
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const currentState = sim.engine.stateManager.getCurrentState();
    const updatePayload = WorldStateAdapter.toMongoCheckpoint(currentState);

    const updatedWorld = await World.findByIdAndUpdate(
      worldId,
      { $set: updatePayload },
      { new: true }
    );

    eventPublisher.publish(worldId, {
      type: 'LOG',
      tick: currentState.tick,
      payload: {
        message: `Simulation checkpoint saved at tick ${currentState.tick}`,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      worldId,
      tick: currentState.tick,
      updatedWorld,
    };
  }

  /**
   * Stop an active simulation and optionally save checkpoint to DB.
   * @param {string} worldId
   * @param {boolean} [persistCheckpoint=true]
   */
  async stopWorldSimulation(worldId, persistCheckpoint = true) {
    const sim = this.activeSimulations.get(worldId);
    if (!sim) {
      return { success: true, message: 'Simulation was not running' };
    }

    sim.engine.stop();

    if (persistCheckpoint) {
      await this.saveSimulationCheckpoint(worldId);
    }

    // Cleanup bindings
    sim.unbind();
    this.activeSimulations.delete(worldId);

    await World.findByIdAndUpdate(worldId, {
      'simulationSettings.status': 'paused',
    });

    return {
      success: true,
      worldId,
      message: 'Simulation stopped successfully',
    };
  }

  /**
   * Retrieve active simulation instance
   * @param {string} worldId
   */
  getActiveSimulation(worldId) {
    return this.activeSimulations.get(worldId) || null;
  }
}

export const simulationBridgeService = new SimulationBridgeService();
export default simulationBridgeService;
