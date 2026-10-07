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
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  launchSimulation,
  stepSimulation,
  saveCheckpoint,
  stopSimulation,
};
