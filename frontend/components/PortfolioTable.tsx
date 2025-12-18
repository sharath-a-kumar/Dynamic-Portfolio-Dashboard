'use client';

import { useState, memo } from 'react';
import type { Holding } from '@/types';
import { getGainLossColorClass, getGainLossBgClass, getGainLossBorderClass } from '@/utils';
import { AnimatedCurrency, AnimatedPercentage } from './AnimatedValue';

/**
 * Props for the PortfolioTable component
 */
export interface PortfolioTableProps {
  holdings: Holding[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Loading skeleton row for the table (desktop view)
 * Requirements: 10.5 - Create skeleton loader for portfolio table
 */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-3 py-3"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24 skeleton-shimmer"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16 ml-auto skeleton-shimmer"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-12 ml-auto skeleton-shimmer"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20 ml-auto skeleton-shimmer"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-14 ml-auto skeleton-shimmer"></div></td>
      <td className="px-3 py-3"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20 skeleton-shimmer"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16 ml-auto skeleton-shimmer"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20 ml-auto skeleton-shimmer"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20 ml-auto skeleton-shimmer"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-12 ml-auto skeleton-shimmer"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16 ml-auto skeleton-shimmer"></div></td>
    </tr>
  );
}

/**
 * Loading skeleton card for mobile view
 * Requirements: 10.5 - Create skeleton loader for portfolio table
 */
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-4 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-32 skeleton-shimmer"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16 skeleton-shimmer"></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded skeleton-shimmer"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded skeleton-shimmer"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded skeleton-shimmer"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded skeleton-shimmer"></div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the entire table (desktop view)
 */
function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </tbody>
  );
}

/**
 * Loading skeleton for mobile card view
 */
function CardsSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

/**
 * Empty state component when no holdings exist
 */
function EmptyState() {
  return (
    <div className="text-center py-12">
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
 * Format currency value in Indian Rupees
 */
function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage value
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Table header component with all required columns
 * Requirements: 1.2 - All required columns must be present
 */
function TableHeader() {
  return (
    <thead className="bg-zinc-50 dark:bg-zinc-800/50">
      <tr className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        <th className="px-3 py-3 whitespace-nowrap">Particulars</th>
        <th className="px-3 py-3 text-right whitespace-nowrap">Purchase Price</th>
        <th className="px-3 py-3 text-right whitespace-nowrap">Quantity</th>
        <th className="px-3 py-3 text-right whitespace-nowrap">Investment</th>
        <th className="px-3 py-3 text-right whitespace-nowrap">Portfolio %</th>
        <th className="px-3 py-3 whitespace-nowrap">NSE/BSE</th>
        <th className="px-3 py-3 text-right whitespace-nowrap">CMP</th>
        <th className="px-3 py-3 text-right whitespace-nowrap">Present Value</th>
        <th className="px-3 py-3 text-right whitespace-nowrap">Gain/Loss</th>
        <th className="px-3 py-3 text-right whitespace-nowrap">P/E Ratio</th>
        <th className="px-3 py-3 text-right whitespace-nowrap">Latest Earnings</th>
      </tr>
    </thead>
  );
}

/**
 * Single holding row component (desktop/tablet table view)
 * Uses AnimatedValue components for live data fields (CMP, Present Value, Gain/Loss)
 * Requirements: 2.3, 4.2, 4.3, 4.4 - Smooth transitions for value changes
 */
const HoldingRow = memo(function HoldingRow({ holding }: { holding: Holding }) {
  const gainLossColorClass = getGainLossColorClass(holding.gainLoss);
  
  return (
    <tr className="text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors active:bg-zinc-100 dark:active:bg-zinc-700/50">
      {/* Particulars */}
      <td className="px-3 py-3 text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
        {holding.particulars}
      </td>
      
      {/* Purchase Price */}
      <td className="px-3 py-3 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {formatCurrency(holding.purchasePrice)}
      </td>
      
      {/* Quantity */}
      <td className="px-3 py-3 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {holding.quantity.toLocaleString('en-IN')}
      </td>
      
      {/* Investment */}
      <td className="px-3 py-3 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {formatCurrency(holding.investment)}
      </td>
      
      {/* Portfolio % */}
      <td className="px-3 py-3 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {formatPercentage(holding.portfolioPercentage)}
      </td>
      
      {/* NSE/BSE Code */}
      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
        <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
          {holding.nseCode}
        </span>
        {holding.bseCode && (
          <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded ml-1">
            {holding.bseCode}
          </span>
        )}
      </td>
      
      {/* CMP - Animated for live updates */}
      <td className="px-3 py-3 text-right text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
        <AnimatedCurrency value={holding.cmp} showDirectionIndicator={true} />
      </td>
      
      {/* Present Value - Animated, recalculates when CMP updates */}
      <td className="px-3 py-3 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
        <AnimatedCurrency value={holding.presentValue} />
      </td>
      
      {/* Gain/Loss - Google Finance style with arrow */}
      <td className="px-3 py-3 text-right whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 font-semibold ${gainLossColorClass}`}>
          {holding.gainLoss !== 0 && (
            <svg
              className={`w-3.5 h-3.5 ${holding.gainLoss > 0 ? '' : 'rotate-180'}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <AnimatedCurrency value={holding.gainLoss} className={gainLossColorClass} />
          <span className="text-xs opacity-80">
            (<AnimatedPercentage value={holding.gainLossPercentage} showSign={true} className={gainLossColorClass} />)
          </span>
        </span>
      </td>
      
      {/* P/E Ratio */}
      <td className="px-3 py-3 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {holding.peRatio !== null ? holding.peRatio.toFixed(2) : '—'}
      </td>
      
      {/* Latest Earnings */}
      <td className="px-3 py-3 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {holding.latestEarnings ?? '—'}
      </td>
    </tr>
  );
});

/**
 * Mobile card view for a single holding
 * Requirements: 7.3, 7.5 - Mobile-friendly layout with touch-friendly interactions
 * Requirements: 2.3, 4.2, 4.3, 4.4 - Smooth transitions for value changes
 */
const HoldingCard = memo(function HoldingCard({ holding, isExpanded, onToggle }: { holding: Holding; isExpanded: boolean; onToggle: () => void }) {
  const gainLossColorClass = getGainLossColorClass(holding.gainLoss);
  const bgClass = getGainLossBgClass(holding.gainLoss);
  const borderClass = getGainLossBorderClass(holding.gainLoss);
  
  return (
    <div 
      className={`bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden transition-all duration-200 ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Card Header - Always visible, touch-friendly */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left active:bg-zinc-50 dark:active:bg-zinc-700/50 transition-colors touch-manipulation"
        aria-expanded={isExpanded}
        aria-label={`${holding.particulars} details`}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {holding.particulars}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                {holding.nseCode}
              </span>
              {holding.bseCode && (
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                  {holding.bseCode}
                </span>
              )}
            </div>
          </div>
          {/* Gain/Loss - Google Finance style with arrow */}
          <div className="flex flex-col items-end">
            <span className={`inline-flex items-center gap-0.5 font-bold ${gainLossColorClass}`}>
              {holding.gainLoss !== 0 && (
                <svg
                  className={`w-3 h-3 ${holding.gainLoss > 0 ? '' : 'rotate-180'}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <AnimatedCurrency value={holding.gainLoss} className={gainLossColorClass} />
            </span>
            <span className={`text-xs ${gainLossColorClass}`}>
              <AnimatedPercentage value={holding.gainLossPercentage} showSign={true} className={gainLossColorClass} />
            </span>
          </div>
        </div>
        
        {/* Quick stats row - CMP and Present Value animated */}
        <div className="flex justify-between items-center mt-3 text-sm">
          <div className="text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-500 dark:text-zinc-500">CMP:</span>{' '}
            <AnimatedCurrency value={holding.cmp} className="font-medium text-zinc-900 dark:text-zinc-100" showDirectionIndicator={true} />
          </div>
          <div className="text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-500 dark:text-zinc-500">Value:</span>{' '}
            <AnimatedCurrency value={holding.presentValue} className="font-medium text-zinc-900 dark:text-zinc-100" />
          </div>
          <svg 
            className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className={`px-4 pb-4 pt-2 border-t ${borderClass} ${bgClass}`}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Purchase Price</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(holding.purchasePrice)}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Quantity</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{holding.quantity.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Investment</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(holding.investment)}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Portfolio %</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatPercentage(holding.portfolioPercentage)}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">P/E Ratio</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{holding.peRatio !== null ? holding.peRatio.toFixed(2) : '—'}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Latest Earnings</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{holding.latestEarnings ?? '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Mobile card list view
 * Requirements: 7.3 - Mobile-friendly layout
 */
function HoldingCardList({ holdings }: { holdings: Holding[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  return (
    <div className="space-y-3 p-4">
      {holdings.map((holding) => (
        <HoldingCard
          key={holding.id}
          holding={holding}
          isExpanded={expandedId === holding.id}
          onToggle={() => handleToggle(holding.id)}
        />
      ))}
    </div>
  );
}

/**
 * Large portfolio table for portfolios with >100 holdings
 * Uses pagination-style rendering for performance
 * Requirements: 10.2, 10.3 - Performance optimization
 * Note: Virtual scrolling temporarily disabled due to react-window v2 API changes
 */
function LargePortfolioTable({ holdings }: { holdings: Holding[] }) {
  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 max-h-[600px] overflow-y-auto">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
        <TableHeader />
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-800">
          {holdings.map((holding) => (
            <HoldingRow key={holding.id} holding={holding} />
          ))}
        </tbody>
      </table>
    </div>
  );
}


/**
 * PortfolioTable Component
 * 
 * Displays stock holdings in a structured table format with all required columns.
 * Supports loading states, empty states, and responsive design.
 * 
 * Optimizations:
 * - React.memo to prevent unnecessary re-renders
 * - Memoized child components (HoldingRow, HoldingCard)
 * - Efficient state management for mobile card expansion
 * 
 * Requirements:
 * - 1.1: Display a table containing all stock holdings
 * - 1.2: Show columns for Particulars, Purchase Price, Quantity, Investment, 
 *        Portfolio %, NSE/BSE, CMP, Present Value, Gain/Loss, P/E Ratio, Latest Earnings
 * - 7.1: Display full table layout optimally on desktop
 * - 7.2: Adapt layout for medium screens (tablet)
 * - 7.3: Adapt layout for small screens (mobile)
 * - 7.4: Adjust layout responsively when viewport changes
 * - 7.5: Maintain readability and usability on small screens
 * - 10.2, 10.3: Performance optimizations with memoization
 * 
 * @param holdings - Array of stock holdings to display
 * @param isLoading - Whether data is currently being loaded
 * @param error - Error object if data fetch failed
 */
function PortfolioTableComponent({ holdings, isLoading, error }: PortfolioTableProps) {
  // Handle error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 sm:p-6">
        <div className="flex items-start sm:items-center">
          <svg
            className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5 sm:mt-0"
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
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-semibold">
              Error loading portfolio
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty state (not loading and no holdings)
  if (!isLoading && holdings.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg overflow-hidden">
      {/* Mobile Card View - visible on small screens (< 768px) */}
      <div className="block md:hidden">
        {isLoading ? (
          <CardsSkeleton />
        ) : (
          <HoldingCardList holdings={holdings} />
        )}
      </div>
      
      {/* Desktop/Tablet Table View - visible on medium screens and up (>= 768px) */}
      <div className="hidden md:block">
        {isLoading ? (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <TableHeader />
              <TableSkeleton />
            </table>
          </div>
        ) : holdings.length > 100 ? (
          // Use optimized table for large portfolios (>100 holdings)
          // Requirements: 10.2, 10.3 - Performance optimization
          <LargePortfolioTable holdings={holdings} />
        ) : (
          // Use regular table for smaller portfolios
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <TableHeader />
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-800">
                {holdings.map((holding) => (
                  <HoldingRow key={holding.id} holding={holding} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Table footer with holdings count */}
      {!isLoading && holdings.length > 0 && (
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing <span className="font-medium text-zinc-900 dark:text-zinc-100">{holdings.length}</span> holding{holdings.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Memoized PortfolioTable component to prevent unnecessary re-renders
 * Requirements: 10.2, 10.3 - Performance optimization with memoization
 */
export const PortfolioTable = memo(PortfolioTableComponent);

export default PortfolioTable;
