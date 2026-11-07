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
};
