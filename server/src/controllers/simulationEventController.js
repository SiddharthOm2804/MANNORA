import { eventPublisher } from '../services/eventPublisher.js';
import { worldService } from '../services/worldService.js';
import { isValidMongoId } from '../utils/validators.js';

/**
 * Server-Sent Events (SSE) controller for real-time simulation updates.
 */
export const streamWorldEvents = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid World ID format: ${id}`,
      });
    }

    const world = await worldService.getWorldById(id);
    if (!world) {
      return res.status(404).json({
        success: false,
        message: `World with ID ${id} not found`,
      });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    if (res.flushHeaders) {
      res.flushHeaders();
    }

    // Initial connection frame
    const connectedEvent = eventPublisher.formatEvent(id, {
      type: 'CONNECTED',
      tick: world.simulationSettings?.currentTick || 0,
      payload: {
        worldName: world.name,
        status: world.simulationSettings?.status || 'initialized',
        message: 'Real-time simulation telemetry stream established',
      },
    });

    res.write(`data: ${JSON.stringify(connectedEvent)}\n\n`);

    // Setup periodic keepalive comment to maintain active TCP connection
    const keepaliveInterval = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': keepalive\n\n');
      }
    }, 15000);

    // Subscribe to EventPublisher for this world
    const unsubscribe = eventPublisher.subscribe(id, (eventData) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
      }
    });

    // Cleanup resources upon client disconnect
    const cleanup = () => {
      clearInterval(keepaliveInterval);
      unsubscribe();
      if (!res.writableEnded) {
        res.end();
      }
    };

    req.on('close', cleanup);
    req.on('end', cleanup);
    req.on('error', cleanup);
  } catch (error) {
    next(error);
  }
};

export default {
  streamWorldEvents,
};
