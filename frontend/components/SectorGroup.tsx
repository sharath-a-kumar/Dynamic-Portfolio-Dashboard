'use client';

import type { Holding, SectorSummary } from '@/types';
import { getGainLossColorClass, getGainLossBgClass, getGainLossBorderClass } from '@/utils';

/**
 * Props for the SectorGroup component
 */
export interface SectorGroupProps {
  sector: string;
  holdings: Holding[];
  summary: SectorSummary;
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
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Sector header component displaying the sector name
 * Requirements: 6.2 - Show a sector header for each group
 */
function SectorHeader({ sector, holdingsCount }: { sector: string; holdingsCount: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-zinc-100 dark:bg-zinc-700/50 border-b border-zinc-200 dark:border-zinc-600">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {sector}
      </h3>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        {holdingsCount} holding{holdingsCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

/**
 * Table header for holdings within a sector
 */
function HoldingsTableHeader() {
  return (
    <thead className="bg-zinc-50 dark:bg-zinc-800/30">
      <tr className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        <th className="px-3 py-2 whitespace-nowrap">Particulars</th>
        <th className="px-3 py-2 text-right whitespace-nowrap">Purchase Price</th>
        <th className="px-3 py-2 text-right whitespace-nowrap">Quantity</th>
        <th className="px-3 py-2 text-right whitespace-nowrap">Investment</th>
        <th className="px-3 py-2 text-right whitespace-nowrap">Portfolio %</th>
        <th className="px-3 py-2 whitespace-nowrap">NSE/BSE</th>
        <th className="px-3 py-2 text-right whitespace-nowrap">CMP</th>
        <th className="px-3 py-2 text-right whitespace-nowrap">Present Value</th>
        <th className="px-3 py-2 text-right whitespace-nowrap">Gain/Loss</th>
        <th className="px-3 py-2 text-right whitespace-nowrap">P/E Ratio</th>
        <th className="px-3 py-2 text-right whitespace-nowrap">Latest Earnings</th>
      </tr>
    </thead>
  );
}

/**
 * Single holding row within a sector
 */
function HoldingRow({ holding }: { holding: Holding }) {
  const gainLossColorClass = getGainLossColorClass(holding.gainLoss);
  
  return (
    <tr className="text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
      <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
        {holding.particulars}
      </td>
      <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {formatCurrency(holding.purchasePrice)}
      </td>
      <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {holding.quantity.toLocaleString('en-IN')}
      </td>
      <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {formatCurrency(holding.investment)}
      </td>
      <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {holding.portfolioPercentage.toFixed(2)}%
      </td>
      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
        <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
          {holding.nseCode}
        </span>
        {holding.bseCode && (
          <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded ml-1">
            {holding.bseCode}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
        {formatCurrency(holding.cmp)}
      </td>
      <td className="px-3 py-2 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
        {formatCurrency(holding.presentValue)}
      </td>
      <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${gainLossColorClass}`}>
        {formatCurrency(holding.gainLoss)}
        <span className="text-xs ml-1">
          ({formatPercentage(holding.gainLossPercentage)})
        </span>
      </td>
      <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {holding.peRatio !== null ? holding.peRatio.toFixed(2) : '—'}
      </td>
      <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        {holding.latestEarnings ?? '—'}
      </td>
    </tr>
  );
}


/**
 * Sector summary component displaying aggregated metrics
 * Requirements: 6.3, 6.4, 6.5 - Display Total Investment, Total Present Value, and Gain/Loss per sector
 */
function SectorSummarySection({ summary }: { summary: SectorSummary }) {
  const gainLossColorClass = getGainLossColorClass(summary.totalGainLoss);
  const bgClass = getGainLossBgClass(summary.totalGainLoss);
  const borderClass = getGainLossBorderClass(summary.totalGainLoss);
  
  return (
    <div className={`px-4 py-3 border-t ${borderClass} ${bgClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {/* Total Investment */}
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Investment
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(summary.totalInvestment)}
            </span>
          </div>
          
          {/* Total Present Value */}
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Present Value
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(summary.totalPresentValue)}
            </span>
          </div>
          
          {/* Gain/Loss with color coding */}
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Gain/Loss
            </span>
            <span className={`text-sm font-bold ${gainLossColorClass}`}>
              {formatCurrency(summary.totalGainLoss)}
              <span className="text-xs ml-1">
                ({formatPercentage(summary.gainLossPercentage)})
              </span>
            </span>
          </div>
        </div>
        
        {/* Sector summary badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${gainLossColorClass} ${bgClass} border ${borderClass}`}>
          {summary.totalGainLoss >= 0 ? 'Profit' : 'Loss'}
        </div>
      </div>
    </div>
  );
}

/**
 * SectorGroup Component
 * 
 * Groups holdings by sector with a header and summary section.
 * Displays all holdings within the sector in a table format.
 * 
 * Requirements:
 * - 6.1: Group stocks by Sector
 * - 6.2: Show a sector header for each group
 * - 6.3: Calculate and display Total Investment per sector
 * - 6.4: Calculate and display Total Present Value per sector
 * - 6.5: Calculate and display Gain/Loss per sector
 * 
 * @param sector - The sector name
 * @param holdings - Array of holdings in this sector
 * @param summary - Aggregated summary for the sector
 */
export function SectorGroup({ sector, holdings, summary }: SectorGroupProps) {
  if (holdings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden mb-6">
      {/* Sector Header */}
      <SectorHeader sector={sector} holdingsCount={holdings.length} />
      
      {/* Holdings Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <HoldingsTableHeader />
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {holdings.map((holding) => (
              <HoldingRow key={holding.id} holding={holding} />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Sector Summary */}
      <SectorSummarySection summary={summary} />
    </div>
  );
}

export default SectorGroup;
