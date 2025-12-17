'use client';

import { useState, memo } from 'react';
import type { Holding, SectorSummary } from '@/types';
import { getGainLossColorClass, getGainLossBgClass, getGainLossBorderClass } from '@/utils';
import { AnimatedCurrency, AnimatedPercentage } from './AnimatedValue';

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
 * Requirements: 7.3, 7.5 - Responsive and touch-friendly
 */
function SectorHeader({ sector, holdingsCount }: { sector: string; holdingsCount: number }) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-zinc-100 dark:bg-zinc-700/50 border-b border-zinc-200 dark:border-zinc-600">
      <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
        {sector}
      </h3>
      <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap ml-2">
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
 * Single holding row within a sector (desktop/tablet table view)
 * Uses AnimatedValue components for live data fields (CMP, Present Value, Gain/Loss)
 * Requirements: 2.3, 4.2, 4.3, 4.4 - Smooth transitions for value changes
 */
const HoldingRow = memo(function HoldingRow({ holding }: { holding: Holding }) {
  const gainLossColorClass = getGainLossColorClass(holding.gainLoss);
  
  return (
    <tr className="text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors active:bg-zinc-100 dark:active:bg-zinc-700/50">
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
      {/* CMP - Animated for live updates */}
      <td className="px-3 py-2 text-right text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
        <AnimatedCurrency value={holding.cmp} showDirectionIndicator={true} />
      </td>
      {/* Present Value - Animated, recalculates when CMP updates */}
      <td className="px-3 py-2 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
        <AnimatedCurrency value={holding.presentValue} />
      </td>
      {/* Gain/Loss - Animated, recalculates when Present Value updates */}
      <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${gainLossColorClass}`}>
        <AnimatedCurrency value={holding.gainLoss} className={gainLossColorClass} />
        <span className="text-xs ml-1">
          (<AnimatedPercentage value={holding.gainLossPercentage} showSign={true} className={gainLossColorClass} />)
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
});

/**
 * Mobile card view for a single holding within a sector
 * Requirements: 7.3, 7.5 - Mobile-friendly layout with touch-friendly interactions
 * Requirements: 2.3, 4.2, 4.3, 4.4 - Smooth transitions for value changes
 */
const HoldingCard = memo(function HoldingCard({ holding, isExpanded, onToggle }: { holding: Holding; isExpanded: boolean; onToggle: () => void }) {
  const gainLossColorClass = getGainLossColorClass(holding.gainLoss);
  const bgClass = getGainLossBgClass(holding.gainLoss);
  const borderClass = getGainLossBorderClass(holding.gainLoss);
  
  return (
    <div 
      className={`bg-white dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden transition-all duration-200 ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Card Header - Always visible, touch-friendly */}
      <button
        onClick={onToggle}
        className="w-full p-3 text-left active:bg-zinc-50 dark:active:bg-zinc-700/50 transition-colors touch-manipulation"
        aria-expanded={isExpanded}
        aria-label={`${holding.particulars} details`}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate text-sm">
              {holding.particulars}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-700 px-1 py-0.5 rounded">
                {holding.nseCode}
              </span>
            </div>
          </div>
          {/* Gain/Loss - Animated for live updates */}
          <div className="flex flex-col items-end">
            <span className={`font-bold text-sm ${gainLossColorClass}`}>
              <AnimatedCurrency value={holding.gainLoss} className={gainLossColorClass} />
            </span>
            <span className={`text-xs ${gainLossColorClass}`}>
              <AnimatedPercentage value={holding.gainLossPercentage} showSign={true} className={gainLossColorClass} />
            </span>
          </div>
        </div>
        
        {/* Quick stats row - CMP and Present Value animated */}
        <div className="flex justify-between items-center mt-2 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">
            CMP: <AnimatedCurrency value={holding.cmp} className="font-medium text-zinc-700 dark:text-zinc-300" showDirectionIndicator={true} />
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            Value: <AnimatedCurrency value={holding.presentValue} className="font-medium text-zinc-700 dark:text-zinc-300" />
          </span>
          <svg 
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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
        <div className={`px-3 pb-3 pt-2 border-t ${borderClass} ${bgClass}`}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Purchase</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(holding.purchasePrice)}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Qty</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{holding.quantity.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Investment</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(holding.investment)}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Portfolio %</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{holding.portfolioPercentage.toFixed(2)}%</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">P/E Ratio</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{holding.peRatio !== null ? holding.peRatio.toFixed(2) : '—'}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Earnings</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{holding.latestEarnings ?? '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Mobile card list view for holdings within a sector
 */
function HoldingCardList({ holdings }: { holdings: Holding[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  return (
    <div className="space-y-2 p-3">
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
 * Sector summary component displaying aggregated metrics
 * Requirements: 6.3, 6.4, 6.5 - Display Total Investment, Total Present Value, and Gain/Loss per sector
 * Requirements: 7.3, 7.4, 7.5 - Responsive layout for all screen sizes
 * Requirements: 2.3, 4.2, 4.3, 4.4 - Smooth transitions for value changes
 */
const SectorSummarySection = memo(function SectorSummarySection({ summary }: { summary: SectorSummary }) {
  const gainLossColorClass = getGainLossColorClass(summary.totalGainLoss);
  const bgClass = getGainLossBgClass(summary.totalGainLoss);
  const borderClass = getGainLossBorderClass(summary.totalGainLoss);
  
  return (
    <div className={`px-3 sm:px-4 py-3 border-t ${borderClass} ${bgClass}`}>
      {/* Mobile layout - stacked grid */}
      <div className="block sm:hidden">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Total Investment */}
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Investment
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(summary.totalInvestment)}
            </span>
          </div>
          
          {/* Total Present Value - Animated */}
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Present Value
            </span>
            <AnimatedCurrency 
              value={summary.totalPresentValue} 
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100" 
            />
          </div>
        </div>
        
        {/* Gain/Loss row with badge - Animated */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Gain/Loss
            </span>
            <span className={`text-sm font-bold ${gainLossColorClass}`}>
              <AnimatedCurrency value={summary.totalGainLoss} className={gainLossColorClass} />
              <span className="text-xs ml-1">
                (<AnimatedPercentage value={summary.gainLossPercentage} showSign={true} className={gainLossColorClass} />)
              </span>
            </span>
          </div>
          
          {/* Sector summary badge */}
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${gainLossColorClass} ${bgClass} border ${borderClass}`}>
            {summary.totalGainLoss >= 0 ? 'Profit' : 'Loss'}
          </div>
        </div>
      </div>
      
      {/* Tablet/Desktop layout - horizontal flex */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 md:gap-6">
          {/* Total Investment */}
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Investment
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(summary.totalInvestment)}
            </span>
          </div>
          
          {/* Total Present Value - Animated */}
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Present Value
            </span>
            <AnimatedCurrency 
              value={summary.totalPresentValue} 
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100" 
            />
          </div>
          
          {/* Gain/Loss with color coding - Animated */}
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Gain/Loss
            </span>
            <span className={`text-sm font-bold ${gainLossColorClass}`}>
              <AnimatedCurrency value={summary.totalGainLoss} className={gainLossColorClass} />
              <span className="text-xs ml-1">
                (<AnimatedPercentage value={summary.gainLossPercentage} showSign={true} className={gainLossColorClass} />)
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
});

/**
 * SectorGroup Component
 * 
 * Groups holdings by sector with a header and summary section.
 * Displays all holdings within the sector in a table format on desktop/tablet,
 * and a card view on mobile devices.
 * 
 * Requirements:
 * - 6.1: Group stocks by Sector
 * - 6.2: Show a sector header for each group
 * - 6.3: Calculate and display Total Investment per sector
 * - 6.4: Calculate and display Total Present Value per sector
 * - 6.5: Calculate and display Gain/Loss per sector
 * - 7.1: Display full table layout optimally on desktop
 * - 7.2: Adapt layout for medium screens (tablet)
 * - 7.3: Adapt layout for small screens (mobile)
 * - 7.4: Adjust layout responsively when viewport changes
 * - 7.5: Maintain readability and usability on small screens
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
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden mb-4 sm:mb-6">
      {/* Sector Header */}
      <SectorHeader sector={sector} holdingsCount={holdings.length} />
      
      {/* Mobile Card View - visible on small screens (< 768px) */}
      <div className="block md:hidden">
        <HoldingCardList holdings={holdings} />
      </div>
      
      {/* Desktop/Tablet Table View - visible on medium screens and up (>= 768px) */}
      <div className="hidden md:block">
        {/* Responsive container with horizontal scroll on tablet screens */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <HoldingsTableHeader />
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {holdings.map((holding) => (
                <HoldingRow key={holding.id} holding={holding} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Sector Summary */}
      <SectorSummarySection summary={summary} />
    </div>
  );
}

export default SectorGroup;
