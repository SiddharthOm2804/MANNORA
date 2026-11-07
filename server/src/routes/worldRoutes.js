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
  injectEvent,
  captureSnapshot,
  restoreSnapshot,
  rewindSimulation,
  jumpToDay,
  createBranch,
  runComparison,
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

// POST /api/worlds/:id/inject-event - Manually trigger / inject simulation event
router.post('/:id/inject-event', injectEvent);

// Time Machine Routes (Phase 12)
router.post('/:id/snapshots', captureSnapshot);
router.post('/:id/snapshots/:snapshotId/restore', restoreSnapshot);
router.post('/:id/rewind', rewindSimulation);
router.post('/:id/jump-to-day', jumpToDay);
router.post('/:id/branches', createBranch);
router.post('/:id/compare', runComparison);

// GET /api/worlds/:id - Get single world details
router.get('/:id', getWorldById);

// PATCH /api/worlds/:id - Update world configuration
router.patch('/:id', updateWorld);

// DELETE /api/worlds/:id - Delete world
router.delete('/:id', deleteWorld);

export default router;
