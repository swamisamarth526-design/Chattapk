/**
 * Validation schemas and functions for authentication
 */
const {
  normalizeEmail,
  sanitizeName,
} = require('../utils/input');

/**
 * Validate registration input
 * @returns { isValid: boolean, errors: object }
 */
const validateRegister = (data) => {
  const errors = {};
  const values = {
    name: sanitizeName(data?.name),
    email: normalizeEmail(data?.email),
    password: typeof data?.password === 'string' ? data.password : '',
    confirmPassword:
      typeof data?.confirmPassword === 'string' ? data.confirmPassword : '',
  };

  // Validate name
  if (!values.name) {
    errors.name = 'Name is required';
  } else if (values.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (values.name.length > 50) {
    errors.name = 'Name cannot exceed 50 characters';
  }

  // Validate email
  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Please provide a valid email address';
  }

  // Validate password
  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  } else if (!/[a-zA-Z]/.test(values.password)) {
    errors.password = 'Password must contain at least one letter';
  }

  // Validate password confirmation
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values,
  };
};

/**
 * Validate login input
 * @returns { isValid: boolean, errors: object }
 */
const validateLogin = (data) => {
  const errors = {};
  const values = {
    email: normalizeEmail(data?.email),
    password: typeof data?.password === 'string' ? data.password : '',
  };

  // Validate email
  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Please provide a valid email address';
  }

  // Validate password
  if (!values.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values,
  };
};

/**
 * Check valid email format using regex
 * Accepts: user@example.com
 * Rejects: invalid@, @example.com, user@.com
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

module.exports = {
  validateRegister,
  validateLogin,
  isValidEmail,
};

