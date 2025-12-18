'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { usePortfolio, useErrorHandler } from '@/hooks';
import { SectorGroup, AutoRefresh, ErrorBoundary, useToast, LoadingBar, ThemeToggle, PortfolioCharts, MetricCard } from '@/components';
import { parseApiErrors } from '@/utils';
import { Briefcase, TrendingUp, Wallet, Percent } from 'lucide-react';
import type { Holding, SectorSummary } from '@/types';

// ... existing helper functions (groupHoldingsBySector, SectorGroupSkeleton, EmptyState, ErrorState) ...

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
 * Requirements: 10.5 - Create skeleton loader for portfolio table
 */
function SectorGroupSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden mb-6 animate-pulse border border-border">
      <div className="px-4 py-3 bg-secondary border-b border-border">
        <div className="h-6 bg-muted rounded w-32"></div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-secondary rounded"></div>
          ))}
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
    <div className="text-center py-16 bg-card rounded-xl shadow-sm border border-border">
      <div className="bg-secondary p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
        <Wallet className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground">
        No holdings found
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
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
    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6">
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="text-red-800 dark:text-red-400 font-semibold flex items-center gap-2">
            Warning
            <span>{title}</span>
          </h3>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">
            {description}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isRetrying ? 'Retrying...' : 'Try again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data, isLoading, error, isRefetching, refresh, lastUpdated } = usePortfolio();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const { addToast } = useToast();
  const { handleError, isRetrying, retry, isOnline } = useErrorHandler({
    onRetry: refresh,
    showToasts: false,
  });

  const handleToggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
  }, []);

  const handleManualRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

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

  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

  const holdings = data?.holdings;
  const sectorGroups = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return new Map();
    }
    return groupHoldingsBySector(holdings);
  }, [holdings]);

  const sortedSectors = useMemo(() => {
    return Array.from(sectorGroups.keys()).sort((a, b) => a.localeCompare(b));
  }, [sectorGroups]);

  return (
    <div className="min-h-screen bg-background pb-10">
      <LoadingBar isLoading={isLoading || isRefetching} variant={isRefetching ? 'success' : 'primary'} />

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient tracking-tight">
              Portfolio Dashboard
            </h1>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Last updated: {new Date(lastUpdated).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* Auto-refresh controls - hidden on very small screens, simplified on mobile */}
            <div className="hidden sm:flex bg-card border border-border rounded-lg p-1 items-center gap-2">
              <div className="flex items-center px-2 sm:px-3 py-1.5 border-r border-border">
                <span className={`w-2 h-2 rounded-full mr-2 ${autoRefreshEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground'}`}></span>
                <span className="text-xs font-medium text-muted-foreground hidden md:block">
                  <AutoRefresh interval={15000} onRefresh={handleManualRefresh} enabled={autoRefreshEnabled} showIndicator={true} />
                </span>
              </div>
              <button
                onClick={handleToggleAutoRefresh}
                className={`text-xs font-medium px-2 sm:px-3 py-1.5 rounded-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${autoRefreshEnabled ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
              >
                Auto: {autoRefreshEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Mobile auto-refresh toggle */}
            <button
              onClick={handleToggleAutoRefresh}
              className={`sm:hidden p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${autoRefreshEnabled ? 'bg-emerald-100 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/20' : 'bg-secondary border-border'}`}
              title={`Auto-refresh: ${autoRefreshEnabled ? 'ON' : 'OFF'}`}
            >
              <span className={`w-2 h-2 rounded-full block ${autoRefreshEnabled ? 'bg-emerald-500' : 'bg-muted-foreground'}`}></span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isRefetching}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-primary/25 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isRefetching ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* Offline Indicator - Requirement 8.3 */}
        {!isOnline && (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 rounded-lg p-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">You are currently offline. Data may be outdated.</span>
          </div>
        )}

        {/* Error State */}
        {error && <ErrorState error={error} onRetry={retry} isRetrying={isRetrying} />}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="animate-fade-in space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 sm:h-32 bg-card border border-border rounded-xl animate-pulse" />)}
            </div>
            <div className="h-48 sm:h-64 bg-card border border-border rounded-xl animate-pulse" />
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && holdings && (
          <div className="animate-in space-y-8">

            {/* Summary Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {(() => {
                const totalInvestment = holdings.reduce((sum, h) => sum + h.investment, 0);
                const totalPresentValue = holdings.reduce((sum, h) => sum + h.presentValue, 0);
                const totalGainLoss = totalPresentValue - totalInvestment;
                const totalGainLossPercentage = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

                return (
                  <>
                    <MetricCard
                      title="Total Investment"
                      value={totalInvestment}
                      icon={Briefcase}
                      gradientBorder="border-l-4 border-l-blue-500"
                      delay={0}
                    />
                    <MetricCard
                      title="Current Value"
                      value={totalPresentValue}
                      icon={Wallet}
                      gradientBorder="border-l-4 border-l-purple-500"
                      delay={1}
                    />
                    <MetricCard
                      title="Total P&L"
                      value={totalGainLoss}
                      icon={TrendingUp}
                      trend={totalGainLossPercentage} // Using percentage as trend
                      gradientBorder={totalGainLoss >= 0 ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-red-500"}
                      delay={2}
                    />
                    <MetricCard
                      title="Return"
                      value={totalGainLossPercentage}
                      isCurrency={false}
                      icon={Percent}
                      trend={totalGainLossPercentage}
                      gradientBorder={totalGainLossPercentage >= 0 ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-red-500"}
                      delay={3}
                    />
                  </>
                );
              })()}
            </div>

            {/* Charts Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Portfolio Analysis</h2>
                {/* Filters could go here */}
              </div>
              <PortfolioCharts holdings={holdings} />
            </div>

            {/* Sector Groups / Tables */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Financial Holdings</h2>
              </div>

              {/* Render Sector Groups */}
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
            </div>

            {/* Portfolio Summary Footer */}
            <div className="mt-8 bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-muted-foreground">
              <p>
                Showing <span className="font-medium text-foreground">{data?.holdings.length ?? 0}</span> holdings across <span className="font-medium text-foreground">{sortedSectors.length}</span> sectors
              </p>
              <p className="text-xs">Market Data deferred by 15 mins</p>
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
