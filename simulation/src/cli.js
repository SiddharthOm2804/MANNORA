#!/usr/bin/env node

/**
 * NEURAL CITY — Standalone Headless Simulation Runner (CLI)
 * Allows executing the deterministic simulation engine independently of any frontend or web server.
 *
 * Usage:
 *   node src/cli.js --ticks 100 --seed 42 --verbose
 */

import { SimulationEngine } from './core/SimulationEngine.js';
import { BuildingSystem } from './buildings/BuildingSystem.js';
import { AgentSystem } from './agents/AgentSystem.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    ticks: 50,
    seed: 42,
    verbose: false,
    json: false,
    agents: 20,
    buildings: 5,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ticks' || args[i] === '-t') {
      options.ticks = parseInt(args[++i], 10) || 50;
    } else if (args[i] === '--seed' || args[i] === '-s') {
      options.seed = parseInt(args[++i], 10) || 42;
    } else if (args[i] === '--agents' || args[i] === '-a') {
      options.agents = parseInt(args[++i], 10) || 20;
    } else if (args[i] === '--buildings' || args[i] === '-b') {
      options.buildings = parseInt(args[++i], 10) || 5;
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      options.verbose = true;
    } else if (args[i] === '--json') {
      options.json = true;
    }
  }

  return options;
}

export function runHeadlessSimulation(options = {}) {
  const { ticks = 50, seed = 42, verbose = false, json = false, agents = 20, buildings = 5 } = options;

  if (!json) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       NEURAL CITY — DETERMINISTIC SIMULATION ENGINE        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`[Config] Seed: ${seed} | Ticks: ${ticks} | Agents: ${agents} | Buildings: ${buildings}`);
  }

  const engine = new SimulationEngine({ seed });
  engine.init();

  const state = engine.stateManager.getCurrentState();

  // Populate initial buildings
  const buildingTypes = ['residential', 'commercial', 'industrial', 'power_plant', 'water_filter', 'vertical_farm', 'research_lab'];
  for (let i = 0; i < buildings; i++) {
    const type = buildingTypes[i % buildingTypes.length];
    const b = BuildingSystem.createBuilding(`bld_${i + 1}`, type);
    state.addBuilding(b);
  }

  // Populate initial agents
  for (let i = 0; i < agents; i++) {
    const a = AgentSystem.createAgent(`agt_${i + 1}`, {}, engine.random);
    state.addAgent(a);
  }

  const startTime = Date.now();

  for (let t = 1; t <= ticks; t++) {
    const stepState = engine.step();

    if (verbose && !json) {
      const m = stepState.getMetrics();
      const clock = engine.clock.getStatus();
      console.log(
        `[Tick ${String(t).padStart(3, ' ')} | Day ${clock.simulationDay} ${String(clock.simulationHour).padStart(2, '0')}:00] ` +
        `Pop: ${m.population} | Treasury: $${m.treasury} | Energy: ${Math.round(m.energy)} | Water: ${Math.round(m.water)} | ` +
        `Happiness: ${m.happiness}% | Health: ${m.health}% | Stability: ${m.stability}%`
      );
    }
  }

  const durationMs = Date.now() - startTime;
  const finalState = engine.stateManager.getCurrentState();
  const summary = {
    seed,
    totalTicks: ticks,
    executionTimeMs: durationMs,
    ticksPerSecond: Math.round((ticks / (durationMs / 1000 || 1)) * 10) / 10,
    finalMetrics: finalState.getMetrics(),
    population: finalState.population,
    economy: finalState.economy,
    activeEvents: finalState.getActiveEvents(),
    eventLogCount: finalState.getEventLog().length,
  };

  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else if (!verbose) {
    console.log(`\n✔ Completed ${ticks} ticks in ${durationMs}ms (${summary.ticksPerSecond} TPS)`);
    console.log('Final Metrics Summary:', summary.finalMetrics);
  }

  return summary;
}

// If run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('cli.js')) {
  const options = parseArgs();
  runHeadlessSimulation(options);
}
