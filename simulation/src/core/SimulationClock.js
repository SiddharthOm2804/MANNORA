/**
 * SimulationClock manages discrete ticks, simulated time progression,
 * fixed delta timesteps, diurnal cycles (simulation day & simulation hour), and playback controls.
 */
export class SimulationClock {
  /**
   * @param {Object} [options]
   * @param {number} [options.tickRate=10] - Ticks per second (Hz)
   * @param {number} [options.timeScale=1.0] - Time speed multiplier
   * @param {number} [options.ticksPerHour=1] - Number of ticks representing one simulation hour
   * @param {number} [options.hoursPerDay=24] - Number of simulation hours in a day
   */
  constructor(options = {}) {
    this.tickRate = options.tickRate || 10;
    this.timeScale = options.timeScale || 1.0;
    this.ticksPerHour = options.ticksPerHour || 1;
    this.hoursPerDay = options.hoursPerDay || 24;

    this.currentTick = 0;
    this.isRunning = false;
    this.isPaused = false;

    // Fixed simulation delta per tick in seconds
    this.fixedDelta = 1 / this.tickRate;

    // Real and simulated elapsed time (in seconds)
    this.elapsedRealTime = 0;
    this.elapsedSimulatedTime = 0;

    this.timerId = null;
    this.lastRealTimestamp = 0;
  }

  /**
   * Current simulation day (1-indexed, starts at Day 1)
   * @returns {number}
   */
  get simulationDay() {
    const ticksPerDay = this.ticksPerHour * this.hoursPerDay;
    return Math.floor(this.currentTick / ticksPerDay) + 1;
  }

  /**
   * Current simulation hour within the day (0 to 23)
   * @returns {number}
   */
  get simulationHour() {
    const totalHours = Math.floor(this.currentTick / this.ticksPerHour);
    return totalHours % this.hoursPerDay;
  }

  /**
   * Advances the simulation clock by 1 discrete tick
   * @returns {{ tick: number, day: number, hour: number, delta: number, simulatedTime: number, dayChanged: boolean, hourChanged: boolean }}
   */
  tick() {
    const prevDay = this.simulationDay;
    const prevHour = this.simulationHour;

    this.currentTick += 1;
    const effectiveDelta = this.fixedDelta * this.timeScale;
    this.elapsedSimulatedTime += effectiveDelta;

    const currentDay = this.simulationDay;
    const currentHour = this.simulationHour;

    return {
      tick: this.currentTick,
      day: currentDay,
      hour: currentHour,
      delta: effectiveDelta,
      simulatedTime: this.elapsedSimulatedTime,
      dayChanged: currentDay !== prevDay,
      hourChanged: currentHour !== prevHour,
    };
  }

  /**
   * Explicit step one tick (alias for tick)
   */
  step() {
    return this.tick();
  }

  /**
   * Start or resume clock ticking via interval
   * @param {Function} [onTick] - Optional tick callback function
   */
  start(onTick) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastRealTimestamp = Date.now();

    const intervalMs = Math.max(10, Math.floor(1000 / (this.tickRate * this.timeScale)));

    this.timerId = setInterval(() => {
      if (!this.isRunning || this.isPaused) return;

      const now = Date.now();
      this.elapsedRealTime += (now - this.lastRealTimestamp) / 1000;
      this.lastRealTimestamp = now;

      const tickInfo = this.tick();
      if (typeof onTick === 'function') {
        onTick(tickInfo);
      }
    }, intervalMs);
  }

  /**
   * Pause clock progression
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume clock progression if paused
   */
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      if (this.isRunning) {
        this.lastRealTimestamp = Date.now();
      }
    }
  }

  /**
   * Stop clock and clear timer
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Reset clock back to tick 0
   */
  reset() {
    this.stop();
    this.currentTick = 0;
    this.elapsedRealTime = 0;
    this.elapsedSimulatedTime = 0;
  }

  /**
   * Set tick rate (ticks per second)
   * @param {number} rate
   */
  setTickRate(rate) {
    if (rate <= 0) throw new Error('Tick rate must be positive');
    this.tickRate = rate;
    this.fixedDelta = 1 / rate;
  }

  /**
   * Set simulation speed multiplier / time scale
   * @param {number} scale
   */
  setTimeScale(scale) {
    if (scale < 0) throw new Error('Time scale must be non-negative');
    this.timeScale = scale;
  }

  /**
   * Speed control helper alias
   * @param {number} multiplier
   */
  setSpeed(multiplier) {
    this.setTimeScale(multiplier);
  }

  /**
   * Returns current clock status
   */
  getStatus() {
    return {
      currentTick: this.currentTick,
      simulationDay: this.simulationDay,
      simulationHour: this.simulationHour,
      tickRate: this.tickRate,
      timeScale: this.timeScale,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      fixedDelta: this.fixedDelta,
      elapsedSimulatedTime: this.elapsedSimulatedTime,
      elapsedRealTime: this.elapsedRealTime,
    };
  }
}

export default SimulationClock;
