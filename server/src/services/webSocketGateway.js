import { WebSocketServer, WebSocket } from 'ws';
import { eventPublisher } from './eventPublisher.js';
import { deltaCompressor } from './deltaCompressor.js';
import { isAllowedWebSocketOrigin } from '../middleware/securityMiddleware.js';
import { authenticateSocketWorld } from '../middleware/authMiddleware.js';

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
      maxPayload: 16 * 1024,
      perMessageDeflate: false,
      verifyClient: (info, done) => {
        const url = new URL(info.req.url, 'http://localhost');
        const worldId = url.searchParams.get('worldId');
        if (!isAllowedWebSocketOrigin(info.origin)) return done(false, 403, 'Origin rejected');
        authenticateSocketWorld(info.req, worldId).then((authorization) => {
          if (!authorization) return done(false, 401, 'Sign in and select an authorised world');
          info.req.authorizedUserId = authorization.userId;
          info.req.authExpiresAt = authorization.expiresAt;
          info.req.authorizedWorldId = worldId;
          return done(true);
        }).catch(() => done(false, 401, 'Unable to authorize world subscription'));
      },
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
    const publisherListener = (event) => {
      this._broadcastEvent(event);
    };
    eventPublisher.on('event', publisherListener);
    this.unbindPublisher = () => eventPublisher.off('event', publisherListener);

    console.log('\x1b[32m[WebSocket Gateway]\x1b[0m Attached at /ws/simulation');
  }

  /**
   * Handle incoming socket connection
   */
  _handleConnection(ws, req) {
    if (!isAllowedWebSocketOrigin(req.headers.origin) || this.clients.size >= 500 || !req.authorizedUserId || !req.authorizedWorldId) {
      ws.close(1008, 'Origin or connection limit rejected');
      return;
    }
    const meta = {
      worldId: req.authorizedWorldId,
      userId: req.authorizedUserId,
      cookieHeader: req.headers.cookie,
      sessionExpiresAt: new Date(req.authExpiresAt).getTime(),
      isAlive: true,
      sendDeltasOnly: true,
      lastTick: 0,
      connectedAt: new Date(),
    };
    this.clients.set(ws, meta);
    meta.sessionExpiryTimer = setTimeout(() => ws.close(1008, 'Session expired'), Math.max(0, meta.sessionExpiresAt - Date.now()));

    ws.on('pong', () => {
      meta.isAlive = true;
    });

    // Parse URL query params if any, e.g. /ws/simulation?worldId=123&deltasOnly=true
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Neural City WebSocket Gateway connected',
      worldId: meta.worldId,
      timestamp: new Date().toISOString(),
    }));

    ws.on('message', (raw) => {
      if (raw.length > 16 * 1024) { ws.close(1009, 'Message too large'); return; }
      const now = Date.now();
      meta.messageWindow ||= { start: now, count: 0 };
      if (now - meta.messageWindow.start > 10_000) meta.messageWindow = { start: now, count: 0 };
      if (++meta.messageWindow.count > 60) { ws.close(1008, 'Message rate exceeded'); return; }
      try {
        const msg = JSON.parse(raw.toString());
        this._handleClientMessage(ws, meta, msg).catch(() => this._send(ws, { type: 'ERROR', message: 'Unable to process subscription.' }));
      } catch (err) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON message' }));
      }
    });

    ws.on('close', () => {
      clearTimeout(meta.sessionExpiryTimer);
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
  async _handleClientMessage(ws, meta, msg) {
    switch (msg.type) {
      case 'SUBSCRIBE_WORLD':
        if (typeof msg.worldId !== 'string' || !/^[a-f\d]{24}$/i.test(msg.worldId)) {
          this._send(ws, { type: 'ERROR', message: 'Invalid world identifier' });
          return;
        }
        const authorization = await authenticateSocketWorld({ headers: { cookie: meta.cookieHeader } }, msg.worldId);
        if (msg.worldId !== meta.worldId || authorization?.userId !== meta.userId) {
          this._send(ws, { type: 'ERROR', message: 'You are not authorised for this world.' });
          return;
        }
        meta.sendDeltasOnly = msg.sendDeltasOnly ?? true;
        // Reset delta baseline for fresh keyframe
        deltaCompressor.resetWorld(meta.worldId);
        this._send(ws, {
          type: 'SUBSCRIBED',
          worldId: meta.worldId,
          sendDeltasOnly: meta.sendDeltasOnly,
        });
        break;

      case 'REQUEST_KEYFRAME':
        if (meta.worldId) {
          deltaCompressor.resetWorld(meta.worldId);
          this._send(ws, {
            type: 'KEYFRAME_REQUESTED',
            worldId: meta.worldId,
          });
        }
        break;

      case 'PING':
        this._send(ws, { type: 'PONG', timestamp: Date.now() });
        break;

      default:
        this._send(ws, { type: 'ACK', received: typeof msg.type === 'string' ? msg.type.slice(0, 40) : 'UNKNOWN' });
        break;
    }
  }

  /**
   * Broadcast simulation event to interested subscribers
   */
  _broadcastEvent(event) {
    if (!this.wss || this.clients.size === 0) return;
    if (event.type === 'ACCESS_REVOKED') {
      for (const [ws, meta] of this.clients) {
        if (meta.worldId === String(event.worldId) && meta.userId === String(event.payload?.userId)) ws.close(1008, 'World access revoked');
      }
      return;
    }
    const deltaFrame = event.type === 'TICK' && event.payload?.state
      ? deltaCompressor.computeDelta(event.worldId, event.payload.state, {
        delta: event.payload.delta,
        simulatedTime: event.payload.simulatedTime,
      })
      : null;

    for (const [ws, meta] of this.clients.entries()) {
      if (ws.readyState !== WebSocket.OPEN) continue;
      if (ws.bufferedAmount > 1_000_000) { ws.close(1013, 'Client is not consuming the stream'); continue; }

      // Filter by world subscription if specified
      if (!meta.worldId || !event.worldId || meta.worldId !== String(event.worldId)) {
        continue;
      }

      // If it's a TICK event, evaluate delta compression
      if (deltaFrame && meta.sendDeltasOnly) {
        // Send compact delta frame instead of megabytes of raw state!
        this._send(ws, {
          type: deltaFrame.isKeyframe ? 'KEYFRAME' : 'TICK_DELTA',
          worldId: event.worldId,
          tick: deltaFrame.tick,
          timestamp: event.timestamp,
          payload: deltaFrame,
        });
      } else {
        // Normal event (STATUS_CHANGE, EVENT_INJECTED, LOG, etc.)
        this._send(ws, event);
      }
    }
  }

  _send(ws, payload) {
    if (ws.readyState !== WebSocket.OPEN || ws.bufferedAmount > 1_000_000) return false;
    ws.send(JSON.stringify(payload), (error) => { if (error) ws.terminate(); });
    return true;
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
    if (this.unbindPublisher) {
      this.unbindPublisher();
      this.unbindPublisher = null;
    }
  }
}

export const webSocketGateway = new WebSocketGateway();

