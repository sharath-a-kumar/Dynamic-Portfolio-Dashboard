/**
 * Error handling middleware
 * Catches and formats errors for consistent API responses
 */

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details (but not sensitive information)
  console.error('Error occurred:', {
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    // Don't log stack trace in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });

  // Determine error type and status code
  let statusCode = err.statusCode || 500;
  let errorResponse = {
    error: err.name || 'ServerError',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  };

  // Handle specific error types
  if (err.source === 'yahoo' || err.source === 'google') {
    // External API errors
    statusCode = 503; // Service Unavailable
    errorResponse.error = 'ExternalServiceError';
    errorResponse.source = err.source;
    if (err.symbol) {
      errorResponse.symbol = err.symbol;
    }
  } else if (err.message.includes('Excel file')) {
    // Excel parsing errors
    statusCode = 400; // Bad Request
    errorResponse.error = 'DataParsingError';
  } else if (err.message.includes('not found')) {
    // Not found errors
    statusCode = 404;
    errorResponse.error = 'NotFoundError';
  } else if (err.message.includes('Invalid')) {
    // Validation errors
    statusCode = 400;
    errorResponse.error = 'ValidationError';
  }

  // Add additional error details in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || null;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'NotFoundError',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
};
