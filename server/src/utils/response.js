/**
 * Consistent API Response Structure
 * Usage: res.status(200).json(sendResponse(data, message, statusCode))
 */
const sendResponse = (data = null, message = 'Success', statusCode = 200) => {
  return {
    success: statusCode < 400,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

const sendError = (message = 'Error', statusCode = 500, error = null) => {
  const shouldIncludeError =
    Boolean(error) &&
    (statusCode < 500 || process.env.NODE_ENV === 'development');

  return {
    success: false,
    statusCode,
    message,
    ...(shouldIncludeError && { error }),
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  sendResponse,
  sendError,
};
