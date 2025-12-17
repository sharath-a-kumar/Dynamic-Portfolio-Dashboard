'use client';

import React from 'react';
import type { Holding } from '@/types';
import { getGainLossColorClass } from '@/utils';

/**
 * Props for the PortfolioTable component
 */
export interface PortfolioTableProps {
  holdings: Holding[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Loading skeleton row for the table
 */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-3 py-3"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16 ml-auto"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-12 ml-auto"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20 ml-auto"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-14 ml-auto"></div></td>
      <td className="px-3 py-3"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16 ml-auto"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20 ml-auto"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20 ml-auto"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-12 ml-auto"></div></td>
      <td className="px-3 py-3 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16 ml-auto"></div></td>
    </tr>
  );
}

/**
 * Loading skeleton for the entire table
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
 * Single holding row component
 */
function HoldingRow({ holding }: { holding: Holding }) {
  const gainLossColorClass = getGainLossColorClass(holding.gainLoss);
  
  return (
    <tr className="text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
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
      
      {/* CMP */}
      <td className="px-3 py-3 text-right text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
        {formatCurrency(holding.cmp)}
      </td>
      
      {/* Present Value */}
      <td className="px-3 py-3 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
        {formatCurrency(holding.presentValue)}
      </td>
      
      {/* Gain/Loss */}
      <td className={`px-3 py-3 text-right font-semibold whitespace-nowrap ${gainLossColorClass}`}>
        {formatCurrency(holding.gainLoss)}
        <span className="text-xs ml-1">
          ({formatPercentage(holding.gainLossPercentage)})
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
}


/**
 * PortfolioTable Component
 * 
 * Displays stock holdings in a structured table format with all required columns.
 * Supports loading states, empty states, and responsive design.
 * 
 * Requirements:
 * - 1.1: Display a table containing all stock holdings
 * - 1.2: Show columns for Particulars, Purchase Price, Quantity, Investment, 
 *        Portfolio %, NSE/BSE, CMP, Present Value, Gain/Loss, P/E Ratio, Latest Earnings
 * - 7.1: Display full table layout optimally on desktop
 * - 7.2: Adapt layout for medium screens (tablet)
 * - 7.3: Adapt layout for small screens (mobile)
 * 
 * @param holdings - Array of stock holdings to display
 * @param isLoading - Whether data is currently being loaded
 * @param error - Error object if data fetch failed
 */
export function PortfolioTable({ holdings, isLoading, error }: PortfolioTableProps) {
  // Handle error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-red-400 mr-3"
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
      {/* Responsive container with horizontal scroll on smaller screens */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <TableHeader />
          
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-800">
              {holdings.map((holding) => (
                <HoldingRow key={holding.id} holding={holding} />
              ))}
            </tbody>
          )}
        </table>
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

export default PortfolioTable;
