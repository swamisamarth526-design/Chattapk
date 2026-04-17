const { sendError } = require('../utils/response');

function getErrorResponseDetails(err) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (err?.errors && typeof err.errors === 'object') {
    return err.errors;
  }

  return {
    name: err?.name,
    code: err?.code,
  };
}

/**
 * Global error handling middleware
 * Must be defined last in middleware stack
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid request data';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with those details already exists';
  } else if (statusCode >= 500) {
    message = 'Something went wrong on the server';
  }

  res
    .status(statusCode)
    .json(sendError(message, statusCode, getErrorResponseDetails(err)));
};

module.exports = errorHandler;

