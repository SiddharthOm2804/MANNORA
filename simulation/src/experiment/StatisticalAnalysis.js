/**
 * StatisticalAnalysis computes sample statistics across multi-run simulation outcomes.
 */
export class StatisticalAnalysis {
  /**
   * Calculate mean of numeric array
   * @param {number[]} values
   * @returns {number}
   */
  static mean(values) {
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((acc, v) => acc + (typeof v === 'number' && !isNaN(v) ? v : 0), 0);
    return sum / values.length;
  }

  /**
   * Calculate variance and standard deviation
   * @param {number[]} values
   * @returns {{ variance: number, stdDev: number }}
   */
  static variance(values) {
    if (!values || values.length <= 1) return { variance: 0, stdDev: 0 };
    const m = this.mean(values);
    const sumSquares = values.reduce((acc, v) => {
      const diff = (typeof v === 'number' && !isNaN(v) ? v : 0) - m;
      return acc + diff * diff;
    }, 0);
    const v = sumSquares / (values.length - 1);
    return {
      variance: Math.round(v * 1000) / 1000,
      stdDev: Math.round(Math.sqrt(v) * 1000) / 1000,
    };
  }

  /**
   * Calculate min, max, and span range
   * @param {number[]} values
   * @returns {{ min: number, max: number, range: number }}
   */
  static range(values) {
    if (!values || values.length === 0) return { min: 0, max: 0, range: 0 };
    let min = Infinity;
    let max = -Infinity;
    for (const v of values) {
      if (typeof v === 'number' && !isNaN(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    if (min === Infinity) return { min: 0, max: 0, range: 0 };
    return {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      range: Math.round((max - min) * 100) / 100,
    };
  }

  /**
   * Calculate quartiles and median
   * @param {number[]} values
   * @returns {{ q1: number, median: number, q3: number, iqr: number }}
   */
  static quartiles(values) {
    if (!values || values.length === 0) return { q1: 0, median: 0, q3: 0, iqr: 0 };
    const sorted = [...values].filter((v) => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (sorted.length === 0) return { q1: 0, median: 0, q3: 0, iqr: 0 };

    const getPercentile = (p) => {
      const idx = (sorted.length - 1) * p;
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      const weight = idx - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    const q1 = Math.round(getPercentile(0.25) * 100) / 100;
    const median = Math.round(getPercentile(0.5) * 100) / 100;
    const q3 = Math.round(getPercentile(0.75) * 100) / 100;

    return {
      q1,
      median,
      q3,
      iqr: Math.round((q3 - q1) * 100) / 100,
    };
  }

  /**
   * Construct binned histogram distribution
   * @param {number[]} values
   * @param {number} [binsCount=10]
   * @returns {Array<{ binStart: number, binEnd: number, count: number, frequency: number, label: string }>}
   */
  static distribution(values, binsCount = 10) {
    if (!values || values.length === 0) return [];
    const valid = values.filter((v) => typeof v === 'number' && !isNaN(v));
    if (valid.length === 0) return [];

    const { min, max } = this.range(valid);
    if (min === max) {
      return [{
        binStart: min,
        binEnd: max,
        count: valid.length,
        frequency: 1.0,
        label: `${min}`,
      }];
    }

    const binSize = (max - min) / binsCount;
    const bins = Array.from({ length: binsCount }, (_, i) => {
      const start = min + i * binSize;
      const end = i === binsCount - 1 ? max : min + (i + 1) * binSize;
      return {
        binStart: Math.round(start * 10) / 10,
        binEnd: Math.round(end * 10) / 10,
        count: 0,
        frequency: 0,
        label: `${Math.round(start)}-${Math.round(end)}`,
      };
    });

    for (const v of valid) {
      let bIdx = Math.floor((v - min) / binSize);
      if (bIdx >= binsCount) bIdx = binsCount - 1;
      if (bIdx < 0) bIdx = 0;
      bins[bIdx].count += 1;
    }

    for (const b of bins) {
      b.frequency = Math.round((b.count / valid.length) * 1000) / 1000;
    }

    return bins;
  }

  /**
   * Summarize an entire numeric metric series
   * @param {number[]} values
   * @param {number} [binsCount=10]
   * @returns {Object}
   */
  static analyzeMetric(values, binsCount = 10) {
    const mean = Math.round(this.mean(values) * 100) / 100;
    const { variance, stdDev } = this.variance(values);
    const { min, max, range } = this.range(values);
    const quartiles = this.quartiles(values);
    const distribution = this.distribution(values, binsCount);

    return {
      count: values.length,
      mean,
      variance,
      stdDev,
      min,
      max,
      range,
      quartiles,
      distribution,
    };
  }
}

