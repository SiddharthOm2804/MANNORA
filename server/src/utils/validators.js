/**
 * Validation utilities for NEURAL CITY server inputs.
 */
export const isValidMongoId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim();
};

export default {
  isValidMongoId,
  sanitizeString,
};
