/**
 * NEURAL CITY — Core Deterministic Simulation Engine Module
 * Exporting foundational simulation components for Phase 4.
 */

// Core Components
export { SimulationEngine } from './core/SimulationEngine.js';
export { WorldState } from './core/WorldState.js';
export { SimulationClock } from './core/SimulationClock.js';
export { StateManager } from './core/StateManager.js';
export { RandomEngine } from './core/RandomEngine.js';

// Time Machine Components (Phase 12)
export { TimeMachine } from './time/TimeMachine.js';
export { SnapshotSystem } from './time/SnapshotSystem.js';
export { BranchEngine } from './time/BranchEngine.js';
export { CounterfactualEngine } from './time/CounterfactualEngine.js';

// Experiment Lab Components (Phase 13)
export { ExperimentLab } from './experiment/ExperimentLab.js';
export { ExperimentRunner } from './experiment/ExperimentRunner.js';
export { StatisticalAnalysis } from './experiment/StatisticalAnalysis.js';

// Modular Subsystems
export { EventEngine } from './events/EventEngine.js';
export { EventQueue } from './events/EventQueue.js';
export { EVENT_TYPES, EVENT_DEFINITIONS, EVENT_SEVERITY, EVENT_CATEGORIES } from './events/EventTypes.js';
export { EventSystem } from './events/EventSystem.js';
export { AgentSystem } from './agents/AgentSystem.js';
export { AgentEngine } from './agents/AgentEngine.js';
export { Agent } from './agents/Agent.js';
export { NeedsSystem } from './agents/NeedsSystem.js';
export { GoalSystem } from './agents/GoalSystem.js';
export { DecisionEngine } from './agents/DecisionEngine.js';
export { MemorySystem } from './agents/MemorySystem.js';
export { EconomySystem } from './economy/EconomySystem.js';
export { EconomyEngine } from './economy/EconomyEngine.js';
export { MarketEngine } from './economy/MarketEngine.js';
export { JobSystem } from './economy/JobSystem.js';
export { FinanceSystem } from './economy/FinanceSystem.js';
export { ResourceSystem } from './resources/ResourceSystem.js';
export { PopulationSystem } from './society/PopulationSystem.js';
export { RelationshipEngine } from './society/RelationshipEngine.js';
export { CommunityEngine } from './society/CommunityEngine.js';
export { SocialDynamics } from './society/SocialDynamics.js';
export { BuildingSystem } from './buildings/BuildingSystem.js';
export { MetricsSystem } from './metrics/MetricsSystem.js';
export { GovernmentEngine } from './government/GovernmentEngine.js';
export { PolicyEngine } from './government/PolicyEngine.js';
export { PublicServiceEngine } from './government/PublicServiceEngine.js';

// Headless Runner
export { runHeadlessSimulation } from './cli.js';

export default {
  SimulationEngine: (await import('./core/SimulationEngine.js')).SimulationEngine,
  WorldState: (await import('./core/WorldState.js')).WorldState,
  SimulationClock: (await import('./core/SimulationClock.js')).SimulationClock,
  StateManager: (await import('./core/StateManager.js')).StateManager,
  RandomEngine: (await import('./core/RandomEngine.js')).RandomEngine,
  TimeMachine: (await import('./time/TimeMachine.js')).TimeMachine,
  SnapshotSystem: (await import('./time/SnapshotSystem.js')).SnapshotSystem,
  BranchEngine: (await import('./time/BranchEngine.js')).BranchEngine,
  CounterfactualEngine: (await import('./time/CounterfactualEngine.js')).CounterfactualEngine,
  EventEngine: (await import('./events/EventEngine.js')).EventEngine,
  EventQueue: (await import('./events/EventQueue.js')).EventQueue,
  EventSystem: (await import('./events/EventSystem.js')).EventSystem,
  AgentSystem: (await import('./agents/AgentSystem.js')).AgentSystem,
  AgentEngine: (await import('./agents/AgentEngine.js')).AgentEngine,
  Agent: (await import('./agents/Agent.js')).Agent,
  NeedsSystem: (await import('./agents/NeedsSystem.js')).NeedsSystem,
  GoalSystem: (await import('./agents/GoalSystem.js')).GoalSystem,
  DecisionEngine: (await import('./agents/DecisionEngine.js')).DecisionEngine,
  MemorySystem: (await import('./agents/MemorySystem.js')).MemorySystem,
  EconomySystem: (await import('./economy/EconomySystem.js')).EconomySystem,
  EconomyEngine: (await import('./economy/EconomyEngine.js')).EconomyEngine,
  MarketEngine: (await import('./economy/MarketEngine.js')).MarketEngine,
  JobSystem: (await import('./economy/JobSystem.js')).JobSystem,
  FinanceSystem: (await import('./economy/FinanceSystem.js')).FinanceSystem,
  ResourceSystem: (await import('./resources/ResourceSystem.js')).ResourceSystem,
  PopulationSystem: (await import('./society/PopulationSystem.js')).PopulationSystem,
  RelationshipEngine: (await import('./society/RelationshipEngine.js')).RelationshipEngine,
  CommunityEngine: (await import('./society/CommunityEngine.js')).CommunityEngine,
  SocialDynamics: (await import('./society/SocialDynamics.js')).SocialDynamics,
  BuildingSystem: (await import('./buildings/BuildingSystem.js')).BuildingSystem,
  MetricsSystem: (await import('./metrics/MetricsSystem.js')).MetricsSystem,
  GovernmentEngine: (await import('./government/GovernmentEngine.js')).GovernmentEngine,
  PolicyEngine: (await import('./government/PolicyEngine.js')).PolicyEngine,
  PublicServiceEngine: (await import('./government/PublicServiceEngine.js')).PublicServiceEngine,
};
