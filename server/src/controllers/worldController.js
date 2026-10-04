import { worldService } from '../services/worldService.js';

/**
 * Controller handling World REST endpoints.
 */
export const createWorld = async (req, res, next) => {
  try {
    const world = await worldService.createWorld(req.body);
    res.status(201).json({
      success: true,
      message: 'Civilization world created successfully',
      data: world,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create world',
    });
  }
};

export const getAllWorlds = async (req, res, next) => {
  try {
    const worlds = await worldService.getAllWorlds();
    res.status(200).json({
      success: true,
      count: worlds.length,
      data: worlds,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorldById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const world = await worldService.getWorldById(id);

    if (!world) {
      return res.status(404).json({
        success: false,
        message: `World with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: world,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateWorld = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await worldService.updateWorld(id, req.body);

    res.status(200).json({
      success: true,
      message: 'World updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteWorld = async (req, res, next) => {
  try {
    const { id } = req.params;
    await worldService.deleteWorld(id);

    res.status(200).json({
      success: true,
      message: `World ${id} deleted successfully`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  createWorld,
  getAllWorlds,
  getWorldById,
  updateWorld,
  deleteWorld,
};
