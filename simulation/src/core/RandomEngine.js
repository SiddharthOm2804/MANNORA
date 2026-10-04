/**
 * Deterministic Pseudo-Random Number Generator (PRNG) for reproducible simulation runs.
 * Uses a 32-bit Mulberry32 algorithm.
 */
export class RandomEngine {
  /**
   * @param {number|string} [seed] - Optional numeric or string seed
   */
  constructor(seed = 123456789) {
    this.initialSeed = this._normalizeSeed(seed);
    this.currentSeed = this.initialSeed;
  }

  /**
   * Convert any seed to a 32-bit unsigned integer
   * @private
   */
  _normalizeSeed(seed) {
    if (typeof seed === 'number') {
      return (seed >>> 0) || 1;
    }
    const str = String(seed);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return (hash >>> 0) || 1;
  }

  /**
   * Resets or sets a new seed
   * @param {number|string} seed
   */
  setSeed(seed) {
    this.initialSeed = this._normalizeSeed(seed);
    this.currentSeed = this.initialSeed;
  }

  /**
   * Get the initial seed value
   * @returns {number}
   */
  getSeed() {
    return this.initialSeed;
  }

  /**
   * Reset PRNG state back to the original seed
   */
  reset() {
    this.currentSeed = this.initialSeed;
  }

  /**
   * Generates next float in range [0, 1)
   * @returns {number}
   */
  nextFloat() {
    // Mulberry32
    let t = (this.currentSeed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    this.currentSeed = (t ^ (t >>> 14)) >>> 0;
    return this.currentSeed / 4294967296;
  }

  /**
   * Generates integer in range [min, max] inclusive
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  nextInt(min, max) {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(this.nextFloat() * (maxFloor - minCeil + 1)) + minCeil;
  }

  /**
   * Returns a boolean based on probability
   * @param {number} [probability=0.5] - Number between 0 and 1
   * @returns {boolean}
   */
  nextBool(probability = 0.5) {
    return this.nextFloat() < probability;
  }

  /**
   * Pick one random element from an array
   * @template T
   * @param {T[]} array
   * @returns {T|null}
   */
  choice(array) {
    if (!array || array.length === 0) return null;
    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Shuffles an array in place using Fisher-Yates algorithm
   * @template T
   * @param {T[]} array
   * @returns {T[]}
   */
  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Sample k unique elements from an array
   * @template T
   * @param {T[]} array
   * @param {number} count
   * @returns {T[]}
   */
  sample(array, count) {
    if (!array || array.length === 0 || count <= 0) return [];
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Generates a normally distributed random number using Box-Muller transform
   * @param {number} [mean=0]
   * @param {number} [stdDev=1]
   * @returns {number}
   */
  gaussian(mean = 0, stdDev = 1) {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.nextFloat();
    while (v === 0) v = this.nextFloat();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
  }
}

export default RandomEngine;
