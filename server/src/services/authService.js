const bcrypt = require('bcryptjs');

/**
 * Hash password utility
 * Usage: const hashedPassword = await hashPassword(password)
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password utility
 * Usage: const isMatch = await comparePassword(password, hashedPassword)
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: min 6 chars, at least one letter
 */
const isValidPassword = (password) => {
  return password && password.length >= 6 && /[a-zA-Z]/.test(password);
};

module.exports = {
  hashPassword,
  comparePassword,
  isValidEmail,
  isValidPassword,
};

