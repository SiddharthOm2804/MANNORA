import { worldService } from '../services/worldService.js';

/**
 * Categorizes and formats errors appropriately:
 * - ValidationError / CastError -> HTTP 400 (Bad Request)
 * - NotFoundError -> HTTP 404 (Not Found)
 * - Unexpected system/infrastructure errors -> delegates to centralized errorHandler via next(error)
 * @param {Error} error
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const handleControllerError = (error, res, next) => {
  // Mongoose Schema Validation Error or client input validation
  if (
    error.name === 'ValidationError' ||
    error.status === 400 ||
    error.message?.includes('required') ||
    error.message?.includes('cannot exceed') ||
    error.message?.includes('must be at least')
  ) {
    const errorDetails = error.errors
      ? Object.values(error.errors).map((e) => e.message)
      : undefined;

    return res.status(400).json({
      success: false,
      message: error.message || 'Validation failed',
      ...(errorDetails && { errors: errorDetails }),
    });
  }

  // Mongoose CastError or Invalid Mongo ObjectId
  if (error.name === 'CastError' || error.message?.includes('Invalid World ID format')) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid ID format',
    });
  }

  // Resource Not Found
  if (error.name === 'NotFoundError' || error.status === 404 || error.message?.includes('not found')) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Resource not found',
    });
  }

  // Delegate unexpected internal errors to central error middleware (HTTP 500)
  next(error);
};

/**
 * Controller handling World REST endpoints.
 */
export const createWorld = async (req, res, next) => {
  try {
    const world = await worldService.createWorld(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Civilization world created successfully',
      data: world,
    });
  } catch (error) {
    handleControllerError(error, res, next);
  }
};

export const getAllWorlds = async (req, res, next) => {
  try {
    const worlds = await worldService.getAllWorlds(req.user._id);
    const accessible = worlds.map((world) => {
      const owner = String(world.ownerId) === String(req.user._id);
      const member = world.members?.find((item) => String(item.userId) === String(req.user._id));
      return { ...world, permissions: { role: owner ? 'owner' : member?.role || 'viewer' } };
    });
    res.status(200).json({
      success: true,
      count: accessible.length,
      data: accessible,
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

    const worldData = typeof world.toObject === 'function' ? world.toObject() : world;
    res.status(200).json({
      success: true,
      data: { ...worldData, permissions: { role: req.worldRole } },
    });
  } catch (error) {
    handleControllerError(error, res, next);
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
    handleControllerError(error, res, next);
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
    handleControllerError(error, res, next);
  }
};

export default {
  createWorld,
  getAllWorlds,
  getWorldById,
  updateWorld,
  deleteWorld,
};
