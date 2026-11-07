import { EventEmitter } from 'events';
import { WorldState } from '../core/WorldState.js';
import { SimulationEngine } from '../core/SimulationEngine.js';

/**
 * BranchEngine manages simulation branch lines (timelines) forked from any
 * historical snapshot or current head state.
 *
 * Guarantees that branching NEVER overwrites the original simulation trunk.
 */
export class BranchEngine extends EventEmitter {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    super();

    /** @type {Map<string, Object>} Registered branches */
    this.branches = new Map();

    /** @type {string} Active branch ID */
    this.activeBranchId = 'main';

    // Register root baseline branch
    this._initMainBranch();
  }

  /**
   * Initialize default root branch
   * @private
   */
  _initMainBranch() {
    const mainBranch = {
      id: 'main',
      name: 'Main Trunk // Canonical Baseline',
      description: 'Canonical deterministic simulation baseline',
      parentBranchId: null,
      forkTick: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active', // 'active' | 'archived' | 'diverged'
      mutationsApplied: [],
      currentState: null,
      ticksRun: 0,
    };
    this.branches.set('main', mainBranch);
  }

  /**
   * Create a new isolated branch from a parent state or snapshot.
   *
   * @param {Object} options
   * @param {string} [options.id]
   * @param {string} options.name
   * @param {string} [options.description]
   * @param {string} [options.parentBranchId='main']
   * @param {WorldState|Object} options.baseState - State snapshot to fork from
   * @param {Object} [options.variableMutations={}] - Initial mutations/variables changed in branch
   * @param {Array<string>} [options.policiesToEnact=[]] - Initial policies to apply
   * @returns {Object} Branch record
   */
  createBranch(options = {}) {
    if (!options.name) {
      throw new Error('BranchEngine.createBranch: Branch name is required');
    }
    if (!options.baseState) {
      throw new Error('BranchEngine.createBranch: baseState is required to fork');
    }

    const parentBranchId = options.parentBranchId || this.activeBranchId || 'main';
    const parentBranch = this.branches.get(parentBranchId);
    if (!parentBranch) {
      throw new Error(`Parent branch '${parentBranchId}' does not exist`);
    }

    // Deep clone baseState so parent remains completely immutable
    const clonedState = options.baseState instanceof WorldState
      ? options.baseState.clone()
      : WorldState.deserialize(options.baseState);

    const forkTick = Number(clonedState.tick ?? 0);
    const branchId = options.id || `branch_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

    const branch = {
      id: branchId,
      name: options.name,
      description: options.description || `Forked from ${parentBranch.name} at tick ${forkTick}`,
      parentBranchId,
      forkTick,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      mutationsApplied: [],
      currentState: clonedState,
      ticksRun: 0,
      initialSnapshot: clonedState.serialize(),
    };

    // Apply initial variable mutations if supplied (e.g. water supply = 130)
    if (options.variableMutations) {
      this.applyMutation(branch, options.variableMutations);
    }

    // Apply policy modifications if requested
    if (Array.isArray(options.policiesToEnact) && options.policiesToEnact.length > 0) {
      for (const polId of options.policiesToEnact) {
        branch.mutationsApplied.push({
          type: 'POLICY_ENACT',
          policyId: polId,
          tick: forkTick,
          appliedAt: new Date().toISOString(),
        });
      }
    }

    this.branches.set(branchId, branch);
    this.emit('branch:created', branch);

    return branch;
  }

  /**
   * Apply an intervention variable mutation to a branch state without touching original.
   *
   * Example:
   * applyMutation(branch, {
   *   resources: { water: { current: 13000 } },
   *   economy: { taxRate: 0.12 }
   * })
   *
   * @param {Object|string} branchOrId
   * @param {Object} mutation
   */
  applyMutation(branchOrId, mutation = {}) {
    const branch = typeof branchOrId === 'string' ? this.branches.get(branchOrId) : branchOrId;
    if (!branch || !branch.currentState) {
      throw new Error('BranchEngine.applyMutation: Valid branch with state is required');
    }

    const state = branch.currentState;

    // Mutate resources (e.g. water = 130 or minerals = 5000)
    if (mutation.resources) {
      for (const [key, val] of Object.entries(mutation.resources)) {
        if (!state.resources[key]) {
          state.resources[key] = { current: 0, max: 10000, production: 0, consumption: 0, net: 0 };
        }
        if (typeof val === 'number') {
          state.resources[key].current = val;
        } else if (typeof val === 'object') {
          Object.assign(state.resources[key], val);
        }
        state.metrics[key] = state.resources[key].current;
      }
    }

    // Mutate economy (e.g. taxRate = 0.10, treasury = 80000)
    if (mutation.economy) {
      state.updateEconomy(mutation.economy);
    }

    // Mutate population (e.g. total, health, education)
    if (mutation.population) {
      state.updatePopulation(mutation.population);
    }

    // Record mutation into branch history
    branch.mutationsApplied.push({
      type: 'VARIABLE_OVERRIDE',
      mutation: JSON.parse(JSON.stringify(mutation)),
      tick: state.tick,
      appliedAt: new Date().toISOString(),
    });

    branch.updatedAt = new Date().toISOString();
    return branch;
  }

  /**
   * Get branch by ID
   * @param {string} branchId
   * @returns {Object|null}
   */
  getBranch(branchId) {
    return this.branches.get(branchId) || null;
  }

  /**
   * List all registered branches
   * @returns {Array<Object>}
   */
  listBranches() {
    return Array.from(this.branches.values()).map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      parentBranchId: b.parentBranchId,
      forkTick: b.forkTick,
      currentTick: b.currentState?.tick ?? b.forkTick,
      status: b.status,
      mutationsCount: b.mutationsApplied.length,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));
  }

  /**
   * Switch the active branch context
   * @param {string} branchId
   */
  switchActiveBranch(branchId) {
    if (!this.branches.has(branchId)) {
      throw new Error(`Branch '${branchId}' not found`);
    }
    this.activeBranchId = branchId;
    this.emit('branch:switched', branchId);
    return this.branches.get(branchId);
  }

  /**
   * Delete a branch (cannot delete 'main')
   * @param {string} branchId
   * @returns {boolean}
   */
  deleteBranch(branchId) {
    if (branchId === 'main') {
      throw new Error('Cannot delete main branch');
    }
    const res = this.branches.delete(branchId);
    if (this.activeBranchId === branchId) {
      this.activeBranchId = 'main';
    }
    return res;
  }
}

export default BranchEngine;
