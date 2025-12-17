/**
 * Custom hook for fetching and managing portfolio data
 * 
 * Features:
 * - Automatic refetching every 15 seconds
 * - Manual refresh functionality
 * - Loading and error state management
 * - React Query integration for caching and optimization
 * 
 * Requirements: 4.1, 4.4
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPortfolio, refreshPortfolio } from '@/lib/api';
import type { PortfolioResponse } from '@/types';

const PORTFOLIO_QUERY_KEY = ['portfolio'];
const REFETCH_INTERVAL = 15000; // 15 seconds in milliseconds

export interface UsePortfolioOptions {
  /**
   * Enable automatic refetching (default: true)
   */
  enabled?: boolean;
  
  /**
   * Custom refetch interval in milliseconds (default: 15000)
   */
  refetchInterval?: number;
}

export interface UsePortfolioReturn {
  /**
   * Portfolio data including holdings, last updated timestamp, and errors
   */
  data: PortfolioResponse | undefined;
  
  /**
   * Loading state - true when initial data is being fetched
   */
  isLoading: boolean;
  
  /**
   * Error object if the query failed
   */
  error: Error | null;
  
  /**
   * True when data is being refetched in the background
   */
  isRefetching: boolean;
  
  /**
   * True if the query has been fetched successfully at least once
   */
  isSuccess: boolean;
  
  /**
   * True if the query resulted in an error
   */
  isError: boolean;
  
  /**
   * Manually trigger a refresh of portfolio data
   * This will fetch fresh data from the backend
   */
  refresh: () => Promise<void>;
  
  /**
   * Last updated timestamp from the data
   */
  lastUpdated: string | undefined;
}

/**
 * Hook for fetching and managing portfolio data
 * 
 * @param options - Configuration options for the hook
 * @returns Portfolio data, loading states, error state, and refresh function
 * 
 * @example
 * ```tsx
 * function PortfolioDashboard() {
 *   const { data, isLoading, error, refresh } = usePortfolio();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <div>
 *       <button onClick={refresh}>Refresh</button>
 *       {data?.holdings.map(holding => (
 *         <div key={holding.id}>{holding.particulars}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePortfolio(options: UsePortfolioOptions = {}): UsePortfolioReturn {
  const {
    enabled = true,
    refetchInterval = REFETCH_INTERVAL,
  } = options;
  
  const queryClient = useQueryClient();
  
  // Main query for portfolio data
  const query = useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: fetchPortfolio,
    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    refetchIntervalInBackground: false, // Pause when tab is not visible
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
  
  /**
   * Manual refresh function
   * Triggers a fresh fetch from the backend and invalidates the cache
   */
  const refresh = async (): Promise<void> => {
    try {
      // Call the refresh endpoint which forces fresh data
      const freshData = await refreshPortfolio();
      
      // Update the cache with fresh data
      queryClient.setQueryData(PORTFOLIO_QUERY_KEY, {
        holdings: freshData.holdings,
        lastUpdated: freshData.lastUpdated,
        errors: [],
      });
      
      // Invalidate to trigger a refetch
      await queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
    } catch (error) {
      // If refresh fails, just invalidate to trigger normal refetch
      await queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
      throw error;
    }
  };
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isRefetching: query.isRefetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    refresh,
    lastUpdated: query.data?.lastUpdated,
  };
}

/**
 * Hook to get the portfolio query key for manual cache manipulation
 */
export function usePortfolioQueryKey() {
  return PORTFOLIO_QUERY_KEY;
}
