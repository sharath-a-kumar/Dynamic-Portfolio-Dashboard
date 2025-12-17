/**
 * Custom hook for error handling with retry functionality
 * 
 * Features:
 * - Automatic error parsing and categorization
 * - Toast notifications for errors
 * - Retry functionality with configurable delays
 * - Network status monitoring
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { parseError, type ParsedError, type ErrorSource } from '@/utils/errorUtils';

export interface UseErrorHandlerOptions {
  /**
   * Callback to execute on retry
   */
  onRetry?: () => Promise<void>;
  /**
   * Whether to show toast notifications automatically
   */
  showToasts?: boolean;
  /**
   * Maximum number of automatic retries
   */
  maxRetries?: number;
}

export interface UseErrorHandlerReturn {
  /**
   * Handle an error - parses it and optionally shows a toast
   */
  handleError: (error: unknown) => ParsedError;
  /**
   * Retry the last failed operation
   */
  retry: () => Promise<void>;
  /**
   * Whether a retry is in progress
   */
  isRetrying: boolean;
  /**
   * Current retry count
   */
  retryCount: number;
  /**
   * Reset the error state
   */
  reset: () => void;
  /**
   * Current network status
   */
  isOnline: boolean;
  /**
   * Last parsed error
   */
  lastError: ParsedError | null;
}

/**
 * Hook for handling errors with retry functionality
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { handleError, retry, isRetrying } = useErrorHandler({
 *     onRetry: async () => {
 *       await fetchData();
 *     },
 *     showToasts: true,
 *   });
 * 
 *   const fetchData = async () => {
 *     try {
 *       const data = await api.getData();
 *     } catch (error) {
 *       handleError(error);
 *     }
 *   };
 * 
 *   return (
 *     <button onClick={retry} disabled={isRetrying}>
 *       {isRetrying ? 'Retrying...' : 'Retry'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const { onRetry, showToasts = true, maxRetries = 3 } = options;
  const { addToast } = useToast();
  
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<ParsedError | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  // Monitor network status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (showToasts) {
        addToast({
          type: 'success',
          title: 'Connection Restored',
          message: 'You are back online. Data will refresh automatically.',
          duration: 3000,
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (showToasts) {
        addToast({
          type: 'warning',
          title: 'Connection Lost',
          message: 'You are offline. Some features may be unavailable.',
          duration: 0, // Don't auto-dismiss
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast, showToasts]);

  /**
   * Handle an error - parse it and show appropriate toast
   */
  const handleError = useCallback(
    (error: unknown): ParsedError => {
      const parsed = parseError(error);
      setLastError(parsed);

      if (showToasts) {
        const toastType = getToastTypeForError(parsed.source);
        addToast({
          type: toastType,
          title: parsed.title,
          message: parsed.message,
          duration: parsed.isRetryable ? 8000 : 5000,
          action: parsed.isRetryable && onRetry
            ? {
                label: 'Retry',
                onClick: () => retry(),
              }
            : undefined,
        });
      }

      return parsed;
    },
    [addToast, showToasts, onRetry]
  );

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(async (): Promise<void> => {
    if (!onRetry || isRetrying) return;

    if (retryCount >= maxRetries) {
      addToast({
        type: 'error',
        title: 'Maximum Retries Reached',
        message: 'Please try again later or contact support if the issue persists.',
        duration: 5000,
      });
      return;
    }

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    try {
      await onRetry();
      // Success - reset retry count
      setRetryCount(0);
      setLastError(null);
      if (showToasts) {
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Operation completed successfully.',
          duration: 3000,
        });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying, retryCount, maxRetries, addToast, showToasts, handleError]);

  /**
   * Reset error state
   */
  const reset = useCallback(() => {
    setRetryCount(0);
    setLastError(null);
    setIsRetrying(false);
  }, []);

  return {
    handleError,
    retry,
    isRetrying,
    retryCount,
    reset,
    isOnline,
    lastError,
  };
}

/**
 * Get toast type based on error source
 */
function getToastTypeForError(source: ErrorSource): 'error' | 'warning' {
  switch (source) {
    case 'yahoo':
    case 'google':
      return 'warning'; // Partial failures are warnings
    case 'network':
    case 'system':
    case 'unknown':
    default:
      return 'error';
  }
}

export default useErrorHandler;
