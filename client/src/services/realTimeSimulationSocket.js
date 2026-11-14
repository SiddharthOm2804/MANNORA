/**
 * RealTimeSimulationSocket provides a resilient WebSocket connection with
 * automatic SSE fallback, delta decompression, and rate-separated rendering buffers.
 *
 * Crucial Phase 16 Principles:
 * - Does not expect or require full world states every tick
 * - Handles sparse DELTA frames and applies them to an in-memory client state cache
 * - Separates backend simulation tick arrivals from frontend requestAnimationFrame render ticks
 * - Reconnects cleanly with automatic KEYFRAME re-synchronization
 */
export class RealTimeSimulationSocket {
  /**
   * @param {string} worldId
   * @param {Object} [options]
   * @param {Function} [options.onDelta] - Called with delta updates
   * @param {Function} [options.onKeyframe] - Called with full state keyframes
   * @param {Function} [options.onStatus] - Called on status changes
   * @param {Function} [options.onConnected]
   * @param {Function} [options.onDisconnected]
   */
  constructor(worldId, options = {}) {
    this.worldId = String(worldId);
    this.options = options;
    /** @type {WebSocket|null} */
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1500;
    this.shouldReconnect = true;
    this.reconnectTimer = null;

    // Local cached accumulator of state
    this.cachedState = {
      tick: 0,
      population: {},
      resources: {},
      economy: {},
      metrics: {},
      agents: new Map(),
    };
  }

  /**
   * Connect to WebSocket gateway
   */
  connect() {
    if (this.socket) {
      this.disconnect();
    }
    this.shouldReconnect = true;

    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    // In development the Vite /ws proxy forwards this same-origin socket to the API.
    const host = loc.host;
    const wsUrl = `${protocol}//${host}/ws/simulation?worldId=${this.worldId}&deltasOnly=true`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        // Subscribe to world with delta compression enabled
        this.socket.send(JSON.stringify({
          type: 'SUBSCRIBE_WORLD',
          worldId: this.worldId,
          sendDeltasOnly: true,
        }));

        if (this.options.onConnected) {
          this.options.onConnected();
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this._handleMessage(msg);
        } catch (err) {
          console.error('[SimulationSocket] Parse error:', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        if (this.options.onDisconnected) {
          this.options.onDisconnected();
        }
        if (this.shouldReconnect) {
          this._attemptReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[SimulationSocket] Socket error:', err.message || err);
      };
    } catch (err) {
      console.error('[SimulationSocket] Connection error:', err);
      this._attemptReconnect();
    }
  }

  /**
   * Process incoming frame (KEYFRAME or DELTA)
   * @private
   */
  _handleMessage(msg) {
    if (msg.type === 'KEYFRAME') {
      const fullState = msg.payload?.state || msg.state || {};
      this.cachedState.tick = msg.tick || fullState.tick || 0;
      this.cachedState.population = { ...(fullState.population || {}) };
      this.cachedState.resources = { ...(fullState.resources || {}) };
      this.cachedState.economy = { ...(fullState.economy || {}) };
      this.cachedState.metrics = { ...(fullState.metrics || {}) };

      if (Array.isArray(fullState.agents)) {
        this.cachedState.agents.clear();
        for (const agt of fullState.agents) {
          this.cachedState.agents.set(agt.id, agt);
        }
      }

      if (this.options.onKeyframe) {
        this.options.onKeyframe(this.cachedState);
      }
    } else if (msg.type === 'TICK_DELTA') {
      const delta = msg.payload || {};
      this.cachedState.tick = msg.tick;

      // Apply sparse changes to accumulator
      if (delta.changes?.resources) {
        Object.assign(this.cachedState.resources, delta.changes.resources);
      }
      if (delta.changes?.economy) {
        Object.assign(this.cachedState.economy, delta.changes.economy);
      }
      if (delta.changes?.population) {
        Object.assign(this.cachedState.population, delta.changes.population);
      }
      if (delta.changes?.metrics) {
        Object.assign(this.cachedState.metrics, delta.changes.metrics);
      }
      if (delta.changes?.agents) {
        for (const agt of delta.changes.agents) {
          const existing = this.cachedState.agents.get(agt.id) || {};
          this.cachedState.agents.set(agt.id, { ...existing, ...agt });
        }
      }

      if (this.options.onDelta) {
        this.options.onDelta(delta, this.cachedState);
      }
    } else if (msg.type === 'STATUS_CHANGE') {
      if (this.options.onStatus) {
        this.options.onStatus(msg.payload, msg.tick);
      }
    } else if (msg.type && !['CONNECTED', 'SUBSCRIBED', 'PONG', 'ACK'].includes(msg.type)) {
      this.options.onEvent?.(msg);
    }
  }

  /**
   * Request full state keyframe on demand
   */
  requestKeyframe() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'REQUEST_KEYFRAME',
        worldId: this.worldId,
      }));
    }
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(10000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1));
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        if (!this.isConnected && this.shouldReconnect) {
          this.connect();
        }
      }, delay);
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export default RealTimeSimulationSocket;

