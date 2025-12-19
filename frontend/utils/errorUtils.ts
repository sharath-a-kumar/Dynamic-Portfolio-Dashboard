/**
 * Error handling utilities for the Portfolio Dashboard
 * 
 * Provides specific error messages for different failure scenarios:
 * - Yahoo Finance failures (CMP data unavailable)
 * - Google Finance failures (financial metrics unavailable)
 * - Network connectivity issues
 * - Rate limiting errors
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import type { ApiError } from '@/types';

/**
 * Error source types
 */
export type ErrorSource = 'yahoo' | 'google' | 'network' | 'system' | 'unknown';

/**
 * Parsed error information
 */
export interface ParsedError {
  source: ErrorSource;
  title: string;
  message: string;
  isRetryable: boolean;
  retryDelay?: number; // milliseconds
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('timeout') ||
      message.includes('offline') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError' // fetch throws TypeError for network issues
    );
  }
  return false;
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429')
    );
  }
  return false;
}

/**
 * Check if error is from Yahoo Finance
 */
export function isYahooFinanceError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('yahoo') ||
      message.includes('cmp') ||
      message.includes('current market price') ||
      message.includes('stock price')
    );
  }
  return false;
}

/**
 * Check if error is from Google Finance
 */
export function isGoogleFinanceError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('google') ||
      message.includes('p/e ratio') ||
      message.includes('pe ratio') ||
      message.includes('earnings') ||
      message.includes('financial metrics')
    );
  }
  return false;
}

/**
 * Parse an error and return structured error information
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export function parseError(error: unknown): ParsedError {
  // Network errors - Requirement 8.3
  if (isNetworkError(error)) {
    return {
      source: 'network',
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      isRetryable: true,
      retryDelay: 3000,
    };
  }

  // Rate limit errors - Requirement 8.4
  if (isRateLimitError(error)) {
    return {
      source: 'system',
      title: 'Service Temporarily Unavailable',
      message: 'Too many requests. The service will automatically retry in a moment.',
      isRetryable: true,
      retryDelay: 10000,
    };
  }

  // Yahoo Finance errors - Requirement 8.1
  if (isYahooFinanceError(error)) {
    return {
      source: 'yahoo',
      title: 'Price Data Unavailable',
      message: 'Unable to fetch current market prices from Yahoo Finance. Some price data may be outdated.',
      isRetryable: true,
      retryDelay: 5000,
    };
  }

  // Google Finance errors - Requirement 8.2
  if (isGoogleFinanceError(error)) {
    return {
      source: 'google',
      title: 'Financial Metrics Unavailable',
      message: 'Unable to fetch P/E ratios and earnings data from Google Finance. Some financial metrics may be unavailable.',
      isRetryable: true,
      retryDelay: 5000,
    };
  }

  // Generic error
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  return {
    source: 'unknown',
    title: 'Error',
    message: errorMessage,
    isRetryable: true,
    retryDelay: 3000,
  };
}

/**
 * Parse API errors from the backend response
 */
export function parseApiErrors(errors: ApiError[]): ParsedError[] {
  // Filter out minor errors that shouldn't show as toasts
  const significantErrors = errors.filter(err => {
    // Skip individual row parsing errors - these are minor
    if (err.source === 'excel' && err.row) {
      return false;
    }
    return true;
  });

  return significantErrors.map((apiError) => {
    switch (apiError.source) {
      case 'yahoo':
        return {
          source: 'yahoo' as ErrorSource,
          title: 'Yahoo Finance Warning',
          message: apiError.symbol
            ? `Unable to fetch price for ${apiError.symbol}: ${apiError.message}`
            : apiError.message,
          isRetryable: true,
          retryDelay: 5000,
        };
      case 'google':
        return {
          source: 'google' as ErrorSource,
          title: 'Google Finance Warning',
          message: apiError.symbol
            ? `Unable to fetch metrics for ${apiError.symbol}: ${apiError.message}`
            : apiError.message,
          isRetryable: true,
          retryDelay: 5000,
        };
      case 'excel':
        return {
          source: 'system' as ErrorSource,
          title: 'Data Warning',
          message: apiError.message,
          isRetryable: false,
          retryDelay: 0,
        };
      default:
        return {
          source: 'system' as ErrorSource,
          title: 'System Warning',
          message: apiError.message,
          isRetryable: true,
          retryDelay: 3000,
        };
    }
  });
}

/**
 * Get user-friendly error message based on HTTP status code
 */
export function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please try again.';
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'Request timed out. Please try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. The server took too long to respond.';
    default:
      return `An error occurred (status: ${status}). Please try again.`;
  }
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}
