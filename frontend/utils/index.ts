/**
 * Utility functions for the Portfolio Dashboard
 */

export {
  GAIN_LOSS_COLORS,
  getGainLossColorType,
  getGainLossColorClass,
  getGainLossBgClass,
  getGainLossBorderClass,
  getGainLossStyles,
  formatGainLossWithSign,
  type GainLossColorType,
} from './gainLossColors';

export {
  parseError,
  parseApiErrors,
  isNetworkError,
  isRateLimitError,
  isYahooFinanceError,
  isGoogleFinanceError,
  getHttpErrorMessage,
  formatErrorForDisplay,
  type ErrorSource,
  type ParsedError,
} from './errorUtils';
