import { Router } from 'express';
import {
  createWorld,
  getAllWorlds,
  getWorldById,
  updateWorld,
  deleteWorld,
} from '../controllers/worldController.js';

const router = Router();

// POST /api/worlds - Create new world
router.post('/', createWorld);

// GET /api/worlds - List all worlds
router.get('/', getAllWorlds);

// GET /api/worlds/:id - Get single world details
router.get('/:id', getWorldById);

// PATCH /api/worlds/:id - Update world configuration
router.patch('/:id', updateWorld);

// DELETE /api/worlds/:id - Delete world
router.delete('/:id', deleteWorld);

export default router;
