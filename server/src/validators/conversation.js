/**
 * Validation schemas and functions for conversation operations
 */
const {
  isValidObjectId,
  normalizeString,
} = require('../utils/input');

/**
 * Validate conversation creation input
 * @returns { isValid: boolean, errors: object }
 */
const validateCreateConversation = (data) => {
  const errors = {};
  const values = {
    otherUserId: normalizeString(data?.otherUserId),
  };

  // Validate otherUserId
  if (!values.otherUserId) {
    errors.otherUserId = 'User ID is required';
  } else if (!isValidObjectId(values.otherUserId)) {
    errors.otherUserId = 'Invalid user ID format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values,
  };
};

/**
 * Validate conversation ID format
 * @returns { isValid: boolean, errors: object }
 */
const validateConversationId = (id) => {
  const errors = {};
  const value = normalizeString(id);

  if (!value) {
    errors.id = 'Conversation ID is required';
  } else if (!isValidObjectId(value)) {
    errors.id = 'Invalid conversation ID format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value,
  };
};

module.exports = {
  validateCreateConversation,
  validateConversationId,
};
