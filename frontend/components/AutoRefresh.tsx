/**
 * AutoRefresh Component
 * 
 * Manages automatic data refresh with configurable interval.
 * Uses Page Visibility API to pause refresh when user navigates away.
 * Provides visual indicator for auto-refresh status.
 * 
 * Requirements: 4.1, 4.4, 4.5
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AutoRefreshProps {
  /**
   * Refresh interval in milliseconds (default: 15000 = 15 seconds)
   */
  interval?: number;
  
  /**
   * Callback function to execute on each refresh
   */
  onRefresh: () => Promise<void>;
  
  /**
   * Whether auto-refresh is enabled (default: true)
   */
  enabled?: boolean;
  
  /**
   * Whether to show the visual indicator (default: true)
   */
  showIndicator?: boolean;
}

export interface AutoRefreshState {
  /**
   * Whether auto-refresh is currently active
   */
  isActive: boolean;
  
  /**
   * Whether a refresh is currently in progress
   */
  isRefreshing: boolean;
  
  /**
   * Whether the page is currently visible
   */
  isPageVisible: boolean;
  
  /**
   * Seconds until next refresh
   */
  secondsUntilRefresh: number;
}

/**
 * AutoRefresh component that handles automatic data refresh with Page Visibility API support
 */
export function AutoRefresh({
  interval = 15000,
  onRefresh,
  enabled = true,
  showIndicator = true,
}: AutoRefreshProps) {
  const [state, setState] = useState<AutoRefreshState>({
    isActive: enabled,
    isRefreshing: false,
    isPageVisible: true,
    secondsUntilRefresh: Math.floor(interval / 1000),
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setState(prev => ({ ...prev, isPageVisible: isVisible }));
    };
    
    // Set initial visibility state
    setState(prev => ({ 
      ...prev, 
      isPageVisible: document.visibilityState === 'visible' 
    }));
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Perform refresh
  const performRefresh = useCallback(async () => {
    if (state.isRefreshing) return;
    
    setState(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      await onRefresh();
      lastRefreshRef.current = Date.now();
    } catch (error) {
      console.error('AutoRefresh: Error during refresh:', error);
    } finally {
      setState(prev => ({ 
        ...prev, 
        isRefreshing: false,
        secondsUntilRefresh: Math.floor(interval / 1000),
      }));
    }
  }, [onRefresh, interval, state.isRefreshing]);
  
  // Main refresh interval
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Only set up interval if enabled and page is visible
    const shouldRefresh = enabled && state.isPageVisible;
    setState(prev => ({ ...prev, isActive: shouldRefresh }));
    
    if (shouldRefresh) {
      intervalRef.current = setInterval(() => {
        performRefresh();
      }, interval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, state.isPageVisible, interval, performRefresh]);
  
  // Countdown timer for visual indicator
  useEffect(() => {
    // Clear existing countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    if (!state.isActive || !showIndicator) return;
    
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - lastRefreshRef.current;
      const remaining = Math.max(0, Math.ceil((interval - elapsed) / 1000));
      setState(prev => ({ ...prev, secondsUntilRefresh: remaining }));
    }, 1000);
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [state.isActive, interval, showIndicator]);
  
  if (!showIndicator) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Status indicator dot */}
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            state.isRefreshing
              ? 'bg-blue-500 animate-pulse'
              : state.isActive
              ? 'bg-green-500'
              : 'bg-zinc-400'
          }`}
          aria-hidden="true"
        />
        <span className="text-zinc-600 dark:text-zinc-400">
          {state.isRefreshing ? (
            'Refreshing...'
          ) : state.isActive ? (
            <>
              Auto-refresh in{' '}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {state.secondsUntilRefresh}s
              </span>
            </>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-500">
              Auto-refresh paused
            </span>
          )}
        </span>
      </div>
      
      {/* Paused reason indicator */}
      {!state.isPageVisible && enabled && (
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          (tab hidden)
        </span>
      )}
    </div>
  );
}

/**
 * Hook to use AutoRefresh state without rendering the component
 */
export function useAutoRefresh({
  interval = 15000,
  onRefresh,
  enabled = true,
}: Omit<AutoRefreshProps, 'showIndicator'>): AutoRefreshState & {
  manualRefresh: () => Promise<void>;
} {
  const [state, setState] = useState<AutoRefreshState>({
    isActive: enabled,
    isRefreshing: false,
    isPageVisible: true,
    secondsUntilRefresh: Math.floor(interval / 1000),
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setState(prev => ({ ...prev, isPageVisible: isVisible }));
    };
    
    setState(prev => ({ 
      ...prev, 
      isPageVisible: document.visibilityState === 'visible' 
    }));
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Perform refresh
  const performRefresh = useCallback(async () => {
    if (state.isRefreshing) return;
    
    setState(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      await onRefresh();
      lastRefreshRef.current = Date.now();
    } catch (error) {
      console.error('AutoRefresh: Error during refresh:', error);
    } finally {
      setState(prev => ({ 
        ...prev, 
        isRefreshing: false,
        secondsUntilRefresh: Math.floor(interval / 1000),
      }));
    }
  }, [onRefresh, interval, state.isRefreshing]);
  
  // Main refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const shouldRefresh = enabled && state.isPageVisible;
    setState(prev => ({ ...prev, isActive: shouldRefresh }));
    
    if (shouldRefresh) {
      intervalRef.current = setInterval(() => {
        performRefresh();
      }, interval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, state.isPageVisible, interval, performRefresh]);
  
  // Countdown timer
  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    if (!state.isActive) return;
    
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - lastRefreshRef.current;
      const remaining = Math.max(0, Math.ceil((interval - elapsed) / 1000));
      setState(prev => ({ ...prev, secondsUntilRefresh: remaining }));
    }, 1000);
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [state.isActive, interval]);
  
  return {
    ...state,
    manualRefresh: performRefresh,
  };
}
