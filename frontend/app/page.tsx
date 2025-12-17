'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePortfolio, useErrorHandler } from '@/hooks';
import { SectorGroup, AutoRefresh, ErrorBoundary, useToast } from '@/components';
import { parseApiErrors } from '@/utils';
import type { Holding, SectorSummary } from '@/types';

/**
 * Groups holdings by sector and calculates sector summaries
 * Requirements: 6.1 - Group stocks by Sector
 */
function groupHoldingsBySector(holdings: Holding[]): Map<string, { holdings: Holding[]; summary: SectorSummary }> {
  const sectorMap = new Map<string, Holding[]>();
  
  // Group holdings by sector
  for (const holding of holdings) {
    const sector = holding.sector || 'Other';
    const existing = sectorMap.get(sector) || [];
    existing.push(holding);
    sectorMap.set(sector, existing);
  }
  
  // Calculate summaries for each sector
  const result = new Map<string, { holdings: Holding[]; summary: SectorSummary }>();
  
  for (const [sector, sectorHoldings] of sectorMap) {
    const totalInvestment = sectorHoldings.reduce((sum, h) => sum + h.investment, 0);
    const totalPresentValue = sectorHoldings.reduce((sum, h) => sum + h.presentValue, 0);
    const totalGainLoss = sectorHoldings.reduce((sum, h) => sum + h.gainLoss, 0);
    const gainLossPercentage = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;
    
    const summary: SectorSummary = {
      sector,
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      gainLossPercentage,
      holdingsCount: sectorHoldings.length,
    };
    
    result.set(sector, { holdings: sectorHoldings, summary });
  }
  
  return result;
}

/**
 * Loading skeleton for sector groups
 */
function SectorGroupSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden mb-6 animate-pulse">
      <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-700/50 border-b border-zinc-200 dark:border-zinc-600">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-600 rounded w-32"></div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-700 rounded"></div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex gap-6">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-600 rounded w-24"></div>
          <div className="h-8 bg-zinc-200 dark:bg-zinc-600 rounded w-24"></div>
          <div className="h-8 bg-zinc-200 dark:bg-zinc-600 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component when no holdings exist
 */
function EmptyState() {
  return (
    <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
      <svg
        className="mx-auto h-12 w-12 text-zinc-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
        No holdings found
      </h3>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Your portfolio is empty. Add holdings to see them displayed here.
      </p>
    </div>
  );
}

/**
 * Error state component with retry functionality
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
function ErrorState({ 
  error, 
  onRetry, 
  isRetrying 
}: { 
  error: Error; 
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  // Determine error type for specific messaging
  const errorMessage = error.message.toLowerCase();
  const isNetworkError = errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout');
  const isYahooError = errorMessage.includes('yahoo') || errorMessage.includes('cmp');
  const isGoogleError = errorMessage.includes('google') || errorMessage.includes('p/e');
  
  let title = 'Error loading portfolio';
  let description = error.message;
  
  if (isNetworkError) {
    title = 'Connection Error';
    description = 'Unable to connect to the server. Please check your internet connection and try again.';
  } else if (isYahooError) {
    title = 'Price Data Unavailable';
    description = 'Unable to fetch current market prices from Yahoo Finance. Please try again later.';
  } else if (isGoogleError) {
    title = 'Financial Metrics Unavailable';
    description = 'Unable to fetch P/E ratios and earnings data from Google Finance. Please try again later.';
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div className="flex items-start">
        <svg
          className="h-6 w-6 text-red-500 mt-0.5 mr-4 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-red-800 dark:text-red-400 font-semibold">
            {title}
          </h3>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">
            {description}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {isRetrying ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Retrying...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try again
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Dashboard Page Component
 * 
 * Displays the portfolio dashboard with holdings grouped by sector.
 * Includes automatic refresh, manual refresh button, and last updated timestamp.
 * 
 * Requirements:
 * - 1.1: Display a table containing all stock holdings
 * - 6.1: Group stocks by Sector
 * - 4.1, 4.4, 4.5: Automatic refresh with Page Visibility API
 * - 8.1, 8.2, 8.3, 8.4, 8.5: Error handling and display
 */
function DashboardContent() {
  const { data, isLoading, error, isRefetching, refresh, lastUpdated } = usePortfolio();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const { addToast } = useToast();
  const { handleError, isRetrying, retry, isOnline } = useErrorHandler({
    onRetry: refresh,
    showToasts: false, // We handle toasts manually for more control
  });

  // Show toast notifications for API errors from the response
  useEffect(() => {
    if (data?.errors && data.errors.length > 0) {
      const parsedErrors = parseApiErrors(data.errors);
      parsedErrors.forEach((err) => {
        addToast({
          type: err.source === 'yahoo' || err.source === 'google' ? 'warning' : 'error',
          title: err.title,
          message: err.message,
          duration: 8000,
        });
      });
    }
  }, [data?.errors, addToast]);

  // Handle fetch errors
  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

  // Group holdings by sector with memoization for performance
  const holdings = data?.holdings;
  const sectorGroups = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return new Map();
    }
    return groupHoldingsBySector(holdings);
  }, [holdings]);

  // Sort sectors alphabetically for consistent display
  const sortedSectors = useMemo(() => {
    return Array.from(sectorGroups.keys()).sort((a, b) => a.localeCompare(b));
  }, [sectorGroups]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header section - Responsive layout for all screen sizes */}
        {/* Requirements: 7.1, 7.2, 7.3, 7.4, 7.5 */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Title and timestamp row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                Portfolio Dashboard
              </h1>
              {lastUpdated && (
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 sm:mt-1">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
            
            {/* Controls - visible on tablet and up in header row */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Auto-refresh indicator */}
              <AutoRefresh
                interval={15000}
                onRefresh={refresh}
                enabled={autoRefreshEnabled}
                showIndicator={true}
              />
              
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  autoRefreshEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600'
                }`}
                aria-label={autoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                {autoRefreshEnabled ? 'Auto: ON' : 'Auto: OFF'}
              </button>
              
              {/* Manual refresh button */}
              <button
                onClick={() => refresh()}
                disabled={isRefetching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isRefetching && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isRefetching ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {/* Mobile controls row - visible only on small screens */}
          <div className="flex sm:hidden items-center justify-between gap-2">
            {/* Auto-refresh indicator */}
            <AutoRefresh
              interval={15000}
              onRefresh={refresh}
              enabled={autoRefreshEnabled}
              showIndicator={true}
            />
            
            <div className="flex items-center gap-2">
              {/* Auto-refresh toggle - compact on mobile */}
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-colors touch-manipulation ${
                  autoRefreshEnabled
                    ? 'bg-green-100 text-green-700 active:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-zinc-100 text-zinc-600 active:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400'
                }`}
                aria-label={autoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                {autoRefreshEnabled ? 'Auto: ON' : 'Auto: OFF'}
              </button>
              
              {/* Manual refresh button - compact on mobile */}
              <button
                onClick={() => refresh()}
                disabled={isRefetching}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 touch-manipulation"
              >
                {isRefetching ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="sr-only">Refreshing</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Offline Indicator - Requirement 8.3 */}
        {/* Requirements: 7.3, 7.5 - Responsive and readable on all screens */}
        {!isOnline && (
          <div className="mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4">
            <div className="flex items-start sm:items-center">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
              </svg>
              <div>
                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium">
                  You are offline
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5 hidden sm:block">
                  Data may be outdated. Connection will resume automatically when online.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API Errors/Warnings - Requirements 8.1, 8.2, 8.4 */}
        {/* Requirements: 7.3, 7.5 - Responsive and readable on all screens */}
        {data?.errors && data.errors.length > 0 && (
          <div className="mb-4 sm:mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
            <div className="flex items-start">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-yellow-800 dark:text-yellow-400 text-xs sm:text-sm font-medium">
                  {data.errors.length} warning{data.errors.length !== 1 ? 's' : ''}:
                </p>
                <ul className="mt-1.5 sm:mt-2 space-y-1">
                  {data.errors.map((err, idx) => (
                    <li key={idx} className="text-yellow-700 dark:text-yellow-300 text-xs sm:text-sm break-words">
                      <span className="font-medium">[{err.source === 'yahoo' ? 'Yahoo' : err.source === 'google' ? 'Google' : 'System'}]</span> {err.message}
                      {err.symbol && <span className="text-yellow-600 dark:text-yellow-400"> ({err.symbol})</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => refresh()}
                disabled={isRefetching}
                className="ml-2 sm:ml-4 text-yellow-600 dark:text-yellow-400 active:text-yellow-700 dark:active:text-yellow-300 text-xs sm:text-sm font-medium whitespace-nowrap touch-manipulation"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Error State - Requirements 8.1, 8.2, 8.3, 8.5 */}
        {error && <ErrorState error={error} onRetry={retry} isRetrying={isRetrying} />}

        {/* Loading State */}
        {isLoading && !error && (
          <div>
            {Array.from({ length: 3 }).map((_, i) => (
              <SectorGroupSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && sortedSectors.length === 0 && <EmptyState />}

        {/* Portfolio grouped by sectors */}
        {!isLoading && !error && sortedSectors.length > 0 && (
          <div>
            {sortedSectors.map((sector) => {
              const sectorData = sectorGroups.get(sector)!;
              return (
                <SectorGroup
                  key={sector}
                  sector={sector}
                  holdings={sectorData.holdings}
                  summary={sectorData.summary}
                />
              );
            })}
            
            {/* Portfolio Summary Footer - Responsive */}
            <div className="mt-4 sm:mt-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Showing <span className="font-medium text-zinc-900 dark:text-zinc-100">{data?.holdings.length ?? 0}</span> holding{(data?.holdings.length ?? 0) !== 1 ? 's' : ''} across <span className="font-medium text-zinc-900 dark:text-zinc-100">{sortedSectors.length}</span> sector{sortedSectors.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Dashboard Page with ErrorBoundary wrapper
 * 
 * Wraps the dashboard content with an ErrorBoundary to catch
 * any React errors and display a fallback UI.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export default function Home() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log error for debugging/monitoring
        console.error('Dashboard error:', error, errorInfo);
      }}
    >
      <DashboardContent />
    </ErrorBoundary>
  );
}
