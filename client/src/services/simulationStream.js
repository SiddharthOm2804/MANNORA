/**
 * SimulationStream establishes and manages real-time Server-Sent Events (SSE)
 * connection to the simulation engine backend.
 */
export class SimulationStream {
  /**
   * @param {string} worldId
   * @param {Object} [options]
   * @param {Function} [options.onTick]
   * @param {Function} [options.onStatus]
   * @param {Function} [options.onEvent]
   * @param {Function} [options.onError]
   * @param {Function} [options.onConnected]
   */
  constructor(worldId, options = {}) {
    this.worldId = worldId;
    this.options = options;
    this.eventSource = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
  }

  /**
   * Open the real-time SSE event stream
   */
  connect() {
    if (this.eventSource) {
      this.disconnect();
    }

    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const streamUrl = `${baseUrl}/worlds/${this.worldId}/events`;

    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleEvent(data);
        } catch (err) {
          console.error('[SimulationStream] Failed to parse SSE message:', err, event.data);
        }
      };

      this.eventSource.onerror = (err) => {
        this.isConnected = false;
        if (this.options.onError) {
          this.options.onError(err);
        }

        // If closed by server, attempt reconnect with exponential backoff
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this._attemptReconnect();
        }
      };
    } catch (err) {
      console.error('[SimulationStream] Error initializing EventSource:', err);
      if (this.options.onError) {
        this.options.onError(err);
      }
    }
  }

  /**
   * Route event to registered callbacks based on event type
   * @private
   */
  _handleEvent(event) {
    switch (event.type) {
      case 'CONNECTED':
        if (this.options.onConnected) this.options.onConnected(event);
        break;
      case 'TICK':
        if (this.options.onTick) this.options.onTick(event.payload, event.tick);
        break;
      case 'STATUS_CHANGE':
        if (this.options.onStatus) this.options.onStatus(event.payload, event.tick);
        break;
      case 'SIMULATION_EVENT':
      case 'LOG':
      default:
        if (this.options.onEvent) this.options.onEvent(event);
        break;
    }
  }

  /**
   * Attempt automatic reconnection
   * @private
   */
  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, delay);
    }
  }

  /**
   * Close SSE connection cleanly
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }
}

/**
 * Helper function to create and subscribe to a world event stream
 */
export const createSimulationStream = (worldId, callbacks = {}) => {
  const stream = new SimulationStream(worldId, callbacks);
  stream.connect();
  return stream;
};

export default SimulationStream;
