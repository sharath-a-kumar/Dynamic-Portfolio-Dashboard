/**
 * ApiError model factory and validators
 */

/**
 * Creates an ApiError object
 * @param {Object} data - The error data
 * @returns {Object} An ApiError object
 */
export function createApiError(data) {
  return {
    source: data.source || 'system',
    message: data.message || 'An unknown error occurred',
    symbol: data.symbol || undefined,
    timestamp: data.timestamp || new Date()
  };
}

/**
 * Validates an ApiError object
 * @param {Object} error - The error to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateApiError(error) {
  const errors = [];
  const validSources = ['yahoo', 'google', 'system'];

  if (!error.source || !validSources.includes(error.source)) {
    errors.push('Invalid source: must be one of yahoo, google, or system');
  }

  if (!error.message || typeof error.message !== 'string') {
    errors.push('Invalid or missing message');
  }

  if (error.symbol !== undefined && typeof error.symbol !== 'string') {
    errors.push('Invalid symbol: must be a string or undefined');
  }

  if (!(error.timestamp instanceof Date) && typeof error.timestamp !== 'string') {
    errors.push('Invalid timestamp: must be a Date or string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates a Yahoo Finance error
 * @param {string} message - Error message
 * @param {string} symbol - Stock symbol (optional)
 * @returns {Object} An ApiError object
 */
export function createYahooError(message, symbol) {
  return createApiError({
    source: 'yahoo',
    message,
    symbol
  });
}

/**
 * Creates a Google Finance error
 * @param {string} message - Error message
 * @param {string} symbol - Stock symbol (optional)
 * @returns {Object} An ApiError object
 */
export function createGoogleError(message, symbol) {
  return createApiError({
    source: 'google',
    message,
    symbol
  });
}

/**
 * Creates a system error
 * @param {string} message - Error message
 * @returns {Object} An ApiError object
 */
export function createSystemError(message) {
  return createApiError({
    source: 'system',
    message
  });
}
