import { simulationBridgeService } from '../services/simulationBridgeService.js';

/**
 * Controller managing simulation execution backed by MongoDB World records.
 */
export const launchSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { autoStart } = req.body || {};

    const result = await simulationBridgeService.launchWorldSimulation(id, { autoStart });

    res.status(200).json({
      success: true,
      message: result.alreadyRunning
        ? `Simulation for world ${id} is already running`
        : `Simulation for world ${id} successfully initialized from database`,
      data: result,
    });
  } catch (error) {
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const stepSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = simulationBridgeService.stepSimulation(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const setSimulationSpeed = async (req, res, next) => {
  try {
    const result = await simulationBridgeService.setSimulationSpeed(req.params.id, Number(req.body?.speed));
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return next(error);
  }
};

export const saveCheckpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await simulationBridgeService.saveSimulationCheckpoint(id);

    res.status(200).json({
      success: true,
      message: `Checkpoint committed for world ${id} at tick ${result.tick}`,
      data: result,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const stopSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await simulationBridgeService.stopWorldSimulation(id);

    res.status(200).json({
      success: true,
      message: `Simulation for world ${id} stopped`,
      data: result,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const injectEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventPayload = req.body || {};

    const result = simulationBridgeService.injectSimulationEvent(id, eventPayload);

    res.status(200).json({
      success: true,
      message: `Event '${result.event.title || result.event.type}' injected into world ${id}`,
      data: result,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const captureSnapshot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = simulationBridgeService.captureSnapshot(id, req.body || {});

    res.status(200).json({
      success: true,
      message: `Snapshot captured for world ${id}`,
      data: result,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const restoreSnapshot = async (req, res, next) => {
  try {
    const { id, snapshotId } = req.params;
    const result = simulationBridgeService.restoreSnapshot(id, snapshotId);

    res.status(200).json({
      success: true,
      message: `State restored from snapshot ${snapshotId}`,
      data: result,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const rewindSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetTick } = req.body || {};
    const result = simulationBridgeService.rewindSimulation(id, targetTick);

    res.status(200).json({
      success: true,
      message: `Simulation rewound to tick ${result.tick}`,
      data: result,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const jumpToDay = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { day } = req.body || {};
    const result = simulationBridgeService.jumpToDay(id, Number(day));

    res.status(200).json({
      success: true,
      message: `Jumped to Day ${result.day} (Tick ${result.tick})`,
      data: result,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = simulationBridgeService.createBranch(id, req.body || {});

    res.status(200).json({
      success: true,
      message: `Branch '${result.branch.name}' created`,
      data: result,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const runComparison = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = simulationBridgeService.runCounterfactualComparison(id, req.body || {});

    res.status(200).json({
      success: true,
      message: `Counterfactual experiment executed for branch`,
      data: result,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// Phase 13 Experiment Lab Controllers
export const runExperiment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const experiment = await simulationBridgeService.runExperiment(id, req.body || {}, req.user._id);

    res.status(200).json({
      success: true,
      message: `Simulation experiment '${experiment.name}' completed`,
      data: experiment,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const listExperiments = async (req, res, next) => {
  try {
    const experiments = simulationBridgeService.listExperiments();
    res.status(200).json({
      success: true,
      data: experiments,
    });
  } catch (error) {
    next(error);
  }
};

export const getExperiment = async (req, res, next) => {
  try {
    const { expId } = req.params;
    const experiment = simulationBridgeService.getExperiment(expId);
    res.status(200).json({
      success: true,
      data: experiment,
    });
  } catch (error) {
    if (error.name === 'NotFoundError' || error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const compareExperiments = async (req, res, next) => {
  try {
    const { experimentIds } = req.body || {};
    const comparison = simulationBridgeService.compareExperiments(experimentIds);
    res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const listWorldExperiments = (req, res) => res.json({ success: true, data: simulationBridgeService.listWorldExperiments(req.params.id, req.user._id) });
export const getWorldExperiment = (req, res, next) => {
  try { return res.json({ success: true, data: simulationBridgeService.getWorldExperiment(req.params.expId, req.params.id, req.user._id) }); }
  catch (error) { if (error.status === 404) return res.status(404).json({ success: false, message: error.message }); return next(error); }
};
export const compareWorldExperiments = (req, res) => {
  try { return res.json({ success: true, data: simulationBridgeService.compareWorldExperiments(req.body?.experimentIds, req.params.id, req.user._id) }); }
  catch (error) { return res.status(error.status || 400).json({ success: false, message: error.message }); }
};
export default {
  launchSimulation,
  stepSimulation,
  saveCheckpoint,
  stopSimulation,
  injectEvent,
  captureSnapshot,
  restoreSnapshot,
  rewindSimulation,
  jumpToDay,
  createBranch,
  runComparison,
  runExperiment,
  listExperiments,
  getExperiment,
  compareExperiments,
};
