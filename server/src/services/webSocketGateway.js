import { WebSocketServer, WebSocket } from 'ws';
import { eventPublisher } from './eventPublisher.js';
import { deltaCompressor } from './deltaCompressor.js';

/**
 * WebSocketGateway provides high-performance bi-directional simulation transport.
 *
 * Capabilities:
 * - Real-time delta streaming with selective subscription
 * - Client heartbeat & automatic dead connection detection
 * - Selective compression: sends only deltas per tick, with periodic or requested full keyframes
 * - Decouples simulation engine execution from frontend connection states
 * - Broadcast channels for room/world multiplexing
 */
export class WebSocketGateway {
  /**
   * @param {Object} [options]
   * @param {number} [options.heartbeatInterval=30000] - Ping interval in ms
   */
  constructor(options = {}) {
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    /** @type {WebSocketServer|null} */
    this.wss = null;
    /** @type {Map<WebSocket, { worldId: string|null, isAlive: boolean, sendDeltasOnly: boolean, lastTick: number }>} */
    this.clients = new Map();
    /** @type {NodeJS.Timeout|null} */
    this.pingTimer = null;
    this.unbindPublisher = null;
  }

  /**
   * Attach WebSocket server to existing HTTP server
   * @param {import('http').Server} httpServer
   */
  attach(httpServer) {
    this.wss = new WebSocketServer({
      server: httpServer,
      path: '/ws/simulation',
    });

    this.wss.on('connection', (ws, req) => {
      this._handleConnection(ws, req);
    });

    // Start heartbeat monitor
    this.pingTimer = setInterval(() => {
      for (const [ws, meta] of this.clients.entries()) {
        if (!meta.isAlive) {
          ws.terminate();
          this.clients.delete(ws);
          continue;
        }
        meta.isAlive = false;
        try {
          ws.ping();
        } catch (_) {
          this.clients.delete(ws);
        }
      }
    }, this.heartbeatInterval);

    // Subscribe to EventPublisher events to stream over WebSocket
    this.unbindPublisher = eventPublisher.on('event', (event) => {
      this._broadcastEvent(event);
    });

    console.log('\x1b[32m[WebSocket Gateway]\x1b[0m Attached at /ws/simulation');
  }

  /**
   * Handle incoming socket connection
   */
  _handleConnection(ws, req) {
    const meta = {
      worldId: null,
      isAlive: true,
      sendDeltasOnly: true,
      lastTick: 0,
      connectedAt: new Date(),
    };
    this.clients.set(ws, meta);

    ws.on('pong', () => {
      meta.isAlive = true;
    });

    // Parse URL query params if any, e.g. /ws/simulation?worldId=123&deltasOnly=true
    try {
      const url = new URL(req.url, 'http://localhost');
      const worldId = url.searchParams.get('worldId');
      if (worldId) {
        meta.worldId = worldId;
      }
    } catch (_) {}

    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Neural City WebSocket Gateway connected',
      worldId: meta.worldId,
      timestamp: new Date().toISOString(),
    }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this._handleClientMessage(ws, meta, msg);
      } catch (err) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON message' }));
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('[WebSocketGateway] Client error:', err.message);
      this.clients.delete(ws);
    });
  }

  /**
   * Handle messages from frontend client
   */
  _handleClientMessage(ws, meta, msg) {
    switch (msg.type) {
      case 'SUBSCRIBE_WORLD':
        meta.worldId = String(msg.worldId);
        meta.sendDeltasOnly = msg.sendDeltasOnly ?? true;
        // Reset delta baseline for fresh keyframe
        deltaCompressor.resetWorld(meta.worldId);
        ws.send(JSON.stringify({
          type: 'SUBSCRIBED',
          worldId: meta.worldId,
          sendDeltasOnly: meta.sendDeltasOnly,
        }));
        break;

      case 'REQUEST_KEYFRAME':
        if (meta.worldId) {
          deltaCompressor.resetWorld(meta.worldId);
          ws.send(JSON.stringify({
            type: 'KEYFRAME_REQUESTED',
            worldId: meta.worldId,
          }));
        }
        break;

      case 'PING':
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        break;

      default:
        ws.send(JSON.stringify({ type: 'ACK', received: msg.type }));
        break;
    }
  }

  /**
   * Broadcast simulation event to interested subscribers
   */
  _broadcastEvent(event) {
    if (!this.wss || this.clients.size === 0) return;

    for (const [ws, meta] of this.clients.entries()) {
      if (ws.readyState !== WebSocket.OPEN) continue;

      // Filter by world subscription if specified
      if (meta.worldId && event.worldId && meta.worldId !== String(event.worldId)) {
        continue;
      }

      // If it's a TICK event, evaluate delta compression
      if (event.type === 'TICK' && meta.sendDeltasOnly && event.payload?.state) {
        const delta = deltaCompressor.computeDelta(event.worldId, event.payload.state, {
          delta: event.payload.delta,
          simulatedTime: event.payload.simulatedTime,
        });

        // Send compact delta frame instead of megabytes of raw state!
        ws.send(JSON.stringify({
          type: delta.isKeyframe ? 'KEYFRAME' : 'TICK_DELTA',
          worldId: event.worldId,
          tick: delta.tick,
          timestamp: event.timestamp,
          payload: delta,
        }));
      } else {
        // Normal event (STATUS_CHANGE, EVENT_INJECTED, LOG, etc.)
        ws.send(JSON.stringify(event));
      }
    }
  }

  /**
   * Clean shutdown
   */
  close() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.wss) {
      for (const ws of this.clients.keys()) {
        try {
          ws.terminate();
        } catch (_) {}
      }
      this.clients.clear();
      this.wss.close();
      this.wss = null;
    }
  }
}

export const webSocketGateway = new WebSocketGateway();

