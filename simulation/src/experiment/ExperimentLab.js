import { ExperimentRunner } from './ExperimentRunner.js';
import { StatisticalAnalysis } from './StatisticalAnalysis.js';

/**
 * ExperimentLab coordinates experiment storage, execution queues, and multi-experiment comparison.
 */
export class ExperimentLab {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    this.experiments = new Map();
    this.runner = options.runner || new ExperimentRunner();
  }

  /**
   * Create and register a new experiment specification.
   *
   * @param {Object} spec
   * @returns {Object}
   */
  createExperiment(spec = {}) {
    const id = spec.id || `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const experiment = {
      id,
      name: spec.name || 'Virtual City Experiment',
      description: spec.description || '',
      status: 'defined',
      createdAt: new Date().toISOString(),
      spec: {
        startingConditions: spec.startingConditions || {},
        variables: spec.variables || {},
        durationDays: spec.durationDays || 30,
        ticksPerDay: spec.ticksPerDay || 1,
        runs: spec.runs || 10,
        seedBehavior: spec.seedBehavior || 'incremental',
        baseSeed: spec.baseSeed || 42,
      },
      results: null,
    };

    this.experiments.set(id, experiment);
    return experiment;
  }

  /**
   * Execute an existing experiment or run ad-hoc spec.
   *
   * @param {string|Object} experimentOrId
   * @param {Function} [onProgress]
   * @returns {Promise<Object>}
   */
  async runExperiment(experimentOrId, onProgress = null) {
    let experiment;
    if (typeof experimentOrId === 'string') {
      experiment = this.experiments.get(experimentOrId);
      if (!experiment) {
        throw new Error(`ExperimentLab: Experiment "${experimentOrId}" not found`);
      }
    } else {
      experiment = this.createExperiment(experimentOrId);
    }

    experiment.status = 'running';
    experiment.startedAt = new Date().toISOString();

    const output = await this.runner.runExperiment({
      id: experiment.id,
      name: experiment.name,
      description: experiment.description,
      ...experiment.spec,
    }, onProgress);

    experiment.status = 'completed';
    experiment.completedAt = new Date().toISOString();
    experiment.results = output;

    this.experiments.set(experiment.id, experiment);
    return experiment;
  }

  /**
   * Retrieve experiment record by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getExperiment(id) {
    return this.experiments.get(id) || null;
  }

  /**
   * List all registered experiments
   * @returns {Array<Object>}
   */
  listExperiments() {
    return Array.from(this.experiments.values());
  }

  /**
   * Delete an experiment record
   * @param {string} id
   * @returns {boolean}
   */
  deleteExperiment(id) {
    return this.experiments.delete(id);
  }

  /**
   * Compare multiple completed experiment outcomes side-by-side.
   *
   * @param {string[]} experimentIds
   * @returns {Object} Comparative outcome matrix
   */
  compareExperiments(experimentIds) {
    if (!experimentIds || experimentIds.length < 2) {
      throw new Error('ExperimentLab.compareExperiments: At least 2 experiment IDs are required');
    }

    const exps = experimentIds.map((id) => this.getExperiment(id)).filter((e) => e && e.results);
    if (exps.length < 2) {
      throw new Error('ExperimentLab.compareExperiments: Found fewer than 2 completed experiments with results');
    }

    const comparison = {
      timestamp: new Date().toISOString(),
      experimentCount: exps.length,
      experiments: exps.map((e) => ({
        id: e.id,
        name: e.name,
        runs: e.spec.runs,
        durationDays: e.spec.durationDays,
        variables: e.spec.variables,
      })),
      metricsComparison: {},
      eventFrequencyComparison: {},
      disclaimer: 'SIMULATION RESULT: Comparative metrics illustrate model behavior differences between test scenarios, not real-world predictions.',
    };

    const metricsToCompare = [
      'population',
      'health',
      'happiness',
      'treasury',
      'gdp',
      'unemployment',
      'water',
      'energy',
      'approval',
      'stability',
    ];

    for (const key of metricsToCompare) {
      comparison.metricsComparison[key] = exps.map((e) => {
        const stat = e.results.aggregatedStats.metrics[key] || {};
        return {
          experimentId: e.id,
          experimentName: e.name,
          mean: stat.mean ?? 0,
          stdDev: stat.stdDev ?? 0,
          min: stat.min ?? 0,
          max: stat.max ?? 0,
          median: stat.quartiles?.median ?? 0,
          variance: stat.variance ?? 0,
        };
      });
    }

    // Compare event frequencies
    const allEventTypes = new Set();
    exps.forEach((e) => {
      Object.keys(e.results.aggregatedStats.eventFrequencies || {}).forEach((t) => allEventTypes.add(t));
    });

    for (const evtType of allEventTypes) {
      comparison.eventFrequencyComparison[evtType] = exps.map((e) => {
        const ef = e.results.aggregatedStats.eventFrequencies?.[evtType] || { totalOccurrences: 0, frequencyPerRun: 0, percentageOfRuns: 0 };
        return {
          experimentId: e.id,
          experimentName: e.name,
          totalOccurrences: ef.totalOccurrences,
          frequencyPerRun: ef.frequencyPerRun,
          percentageOfRuns: ef.percentageOfRuns,
        };
      });
    }

    return comparison;
  }
}

