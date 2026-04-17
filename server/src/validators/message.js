/**
 * Validation schemas and functions for message operations
 */
const {
  isValidObjectId,
  normalizeString,
  parsePositiveInt,
  sanitizeMessageText,
} = require('../utils/input');

/**
 * Validate message creation input
 * @returns { isValid: boolean, errors: object }
 */
const validateSendMessage = (data) => {
  const errors = {};
  const values = {
    conversationId: normalizeString(data?.conversationId),
    text: sanitizeMessageText(data?.text),
  };

  // Validate conversationId
  if (!values.conversationId) {
    errors.conversationId = 'Conversation ID is required';
  } else if (!isValidObjectId(values.conversationId)) {
    errors.conversationId = 'Invalid conversation ID format';
  }

  // Validate message text
  if (!values.text) {
    errors.text = 'Message text is required';
  } else if (values.text.length > 5000) {
    errors.text = 'Message cannot exceed 5000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values,
  };
};

/**
 * Validate message ID format
 * @returns { isValid: boolean, errors: object }
 */
const validateMessageId = (id) => {
  const errors = {};
  const value = normalizeString(id);

  if (!value) {
    errors.id = 'Message ID is required';
  } else if (!isValidObjectId(value)) {
    errors.id = 'Invalid message ID format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value,
  };
};

/**
 * Validate pagination parameters
 * @returns { isValid: boolean, errors: object, limit: number, page: number }
 */
const validatePagination = (data) => {
  const errors = {};
  let limit = parsePositiveInt(data?.limit, 20);
  let page = parsePositiveInt(data?.page, 1);

  if (
    data?.limit !== undefined &&
    data?.limit !== '' &&
    !Number.isInteger(Number(data.limit))
  ) {
    errors.limit = 'Limit must be a whole number';
  }

  if (
    data?.page !== undefined &&
    data?.page !== '' &&
    !Number.isInteger(Number(data.page))
  ) {
    errors.page = 'Page must be a whole number';
  }

  // Validate limit
  if (limit < 1) {
    errors.limit = 'Limit must be at least 1';
  } else if (limit > 100) {
    limit = 100; // Cap at 100 to prevent abuse
  }

  // Validate page
  if (page < 1) {
    errors.page = 'Page must be at least 1';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    limit,
    page,
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
  validateSendMessage,
  validateMessageId,
  validatePagination,
  validateConversationId,
};
