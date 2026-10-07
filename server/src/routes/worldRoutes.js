import { Router } from 'express';
import {
  createWorld,
  getAllWorlds,
  getWorldById,
  updateWorld,
  deleteWorld,
} from '../controllers/worldController.js';
import { streamWorldEvents } from '../controllers/simulationEventController.js';
import {
  launchSimulation,
  stepSimulation,
  saveCheckpoint,
  stopSimulation,
} from '../controllers/simulationController.js';

const router = Router();

// POST /api/worlds - Create new world
router.post('/', createWorld);

// GET /api/worlds - List all worlds
router.get('/', getAllWorlds);

// GET /api/worlds/:id/events - Real-time SSE simulation event stream
router.get('/:id/events', streamWorldEvents);
router.get('/:id/stream', streamWorldEvents);

// Simulation Lifecycle & Database Bridge routes
// POST /api/worlds/:id/launch - Launch simulation from MongoDB World record
router.post('/:id/launch', launchSimulation);

// POST /api/worlds/:id/step - Step in-memory simulation by 1 tick
router.post('/:id/step', stepSimulation);

// POST /api/worlds/:id/checkpoint - Persist simulation snapshot back to MongoDB
router.post('/:id/checkpoint', saveCheckpoint);

// POST /api/worlds/:id/stop - Stop active simulation
router.post('/:id/stop', stopSimulation);

// GET /api/worlds/:id - Get single world details
router.get('/:id', getWorldById);

// PATCH /api/worlds/:id - Update world configuration
router.patch('/:id', updateWorld);

// DELETE /api/worlds/:id - Delete world
router.delete('/:id', deleteWorld);

export default router;
