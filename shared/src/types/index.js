/**
 * JSDoc type definitions and schemas for NEURAL CITY.
 * 
 * @typedef {Object} WorldDimensions
 * @property {number} width - World grid width
 * @property {number} height - World grid height
 * 
 * @typedef {Object} WorldMetrics
 * @property {number} population - Total citizen count
 * @property {number} energy - Available energy units
 * @property {number} treasury - Municipal capital reserves
 * @property {number} happiness - Average collective happiness (0-100)
 * @property {number} health - Average collective health (0-100)
 * 
 * @typedef {Object} HealthResponse
 * @property {'healthy'|'degraded'|'down'} status - Overall health status
 * @property {string} message - Human-readable health summary
 * @property {string} timestamp - ISO8601 timestamp
 * @property {Object} server - Server runtime stats
 * @property {Object} database - Database connection status
 * @property {Object} engine - Simulation engine metadata
 */

export const SCHEMAS = {
  version: '0.1.0',
};

export default SCHEMAS;
