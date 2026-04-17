/**
 * Validation schemas and functions for user operations
 */
const {
  isValidObjectId,
  normalizeString,
  parsePositiveInt,
} = require('../utils/input');

/**
 * Validate search query
 * @returns { isValid: boolean, errors: object, query: string }
 */
const validateSearch = (data) => {
  const errors = {};
  const query = normalizeString(data?.q);

  // Validate search query
  if (!query || query.length === 0) {
    errors.q = 'Search query is required';
  } else if (query.length < 2) {
    errors.q = 'Search query must be at least 2 characters';
  } else if (query.length > 100) {
    errors.q = 'Search query cannot exceed 100 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    query,
  };
};

/**
 * Validate pagination parameters
 * @returns { isValid: boolean, errors: object, limit: number, offset: number }
 */
const validatePagination = (data) => {
  const errors = {};
  let limit = parsePositiveInt(data?.limit, 20);
  let offset = parsePositiveInt(data?.offset, 0);

  if (
    data?.limit !== undefined &&
    data?.limit !== '' &&
    !Number.isInteger(Number(data.limit))
  ) {
    errors.limit = 'Limit must be a whole number';
  }

  if (
    data?.offset !== undefined &&
    data?.offset !== '' &&
    !Number.isInteger(Number(data.offset))
  ) {
    errors.offset = 'Offset must be a whole number';
  }

  // Validate limit
  if (limit < 1) {
    errors.limit = 'Limit must be at least 1';
  } else if (limit > 100) {
    limit = 100; // Cap at 100 to prevent abuse
  }

  // Validate offset
  if (offset < 0) {
    errors.offset = 'Offset must be non-negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    limit,
    offset,
  };
};

const validateUserId = (id) => {
  const errors = {};
  const value = normalizeString(id);

  if (!value) {
    errors.id = 'User ID is required';
  } else if (!isValidObjectId(value)) {
    errors.id = 'Invalid user ID format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value,
  };
};

module.exports = {
  validateSearch,
  validatePagination,
  validateUserId,
};
