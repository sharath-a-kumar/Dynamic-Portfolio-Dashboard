'use client';

import { useState, memo } from 'react';
import { CompanyLogo } from './CompanyLogo';
import type { Holding, SectorSummary } from '@/types';
import { AnimatedCurrency, AnimatedPercentage } from './AnimatedValue';
import { ChevronDown, ChevronUp, Eye, ShoppingCart, DollarSign } from 'lucide-react';

export interface SectorGroupProps {
  sector: string;
  holdings: Holding[];
  summary: SectorSummary;
}

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// Sparkline Component - Enhanced visibility
const TrendSparkline = ({ isPositive }: { isPositive: boolean }) => {
  const color = isPositive ? '#10b981' : '#ef4444';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  // More pronounced path
  const path = isPositive
    ? "M0 25 L10 22 L20 28 L30 15 L40 20 L50 8 L60 12 L70 5 L80 0"
    : "M0 5 L10 12 L20 8 L30 20 L40 15 L50 28 L60 22 L70 25 L80 30";

  return (
    <div className="flex justify-center items-center h-full w-24">
      <svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <path d={path} stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`${path} L80 30 L0 30 Z`} fill={fillColor} stroke="none" />
      </svg>
    </div>
  );
};

// Portfolio Percentage Bar - More prominent
const PortfolioBar = ({ percentage }: { percentage: number }) => (
  <div className="flex flex-col gap-1 w-28">
    <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
      <span>{percentage.toFixed(2)}%</span>
    </div>
    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]"
        style={{ width: `${Math.min(percentage * 5, 100)}%` }}
      />
    </div>
  </div>
);

function SectorHeader({ sector, holdingsCount }: { sector: string; holdingsCount: number }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          {sector}
        </h3>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
          {holdingsCount}
        </span>
      </div>
    </div>
  );
}

function HoldingsTableHeader() {
  return (
    <thead className="bg-accent table-sticky-header z-10">
      <tr className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <th className="px-6 py-4 rounded-tl-lg">Particulars</th>
        <th className="px-4 py-4 text-right">Market Price</th>
        <th className="px-4 py-4 text-right">Value</th>
        <th className="px-4 py-4 text-right">P&L</th>
        <th className="px-4 py-4 text-center">Trend</th>
        <th className="px-4 py-4">Portfolio %</th>
        <th className="px-4 py-4 text-right">Fundamentals</th>
        <th className="px-4 py-4 text-center rounded-tr-lg w-[140px]">Action</th>
      </tr>
    </thead>
  );
}

const HoldingRow = memo(function HoldingRow({ holding }: { holding: Holding }) {
  const isProfit = holding.gainLoss >= 0;

  return (
    <tr className="group text-sm border-b border-border hover:bg-secondary/50 transition-all duration-200 last:border-0 bg-card cursor-pointer">
      {/* Particulars & Badges */}
      <td className="px-6 py-4 relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary transition-colors"></div>
        <div className="flex items-center gap-3">
          <CompanyLogo name={holding.particulars} nseCode={holding.nseCode} size={32} className="shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-[15px]">{holding.particulars}</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                {holding.nseCode}
              </span>
              {holding.bseCode && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                  BSE
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* CMP */}
      <td className="px-4 py-4 text-right">
        <div className="flex flex-col items-end">
          <AnimatedCurrency
            value={holding.cmp}
            className="font-semibold text-foreground"
            showDirectionIndicator={true}
          />
          <span className="text-xs text-muted-foreground mt-1">
            Qty: <span className="text-foreground font-medium">{holding.quantity}</span>
          </span>
        </div>
      </td>

      {/* Value & Investment */}
      <td className="px-4 py-4 text-right">
        <div className="flex flex-col items-end">
          <AnimatedCurrency value={holding.presentValue} className="font-bold text-foreground text-[15px]" />
          <span className="text-xs text-muted-foreground mt-1">
            Inv: {formatCurrency(holding.investment)}
          </span>
        </div>
      </td>

      {/* P&L - Enhanced Separation */}
      <td className="px-4 py-4 text-right">
        <div className="flex flex-col items-end gap-1">
          <span className={`font-bold text-[15px] ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}<AnimatedCurrency value={holding.gainLoss} />
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isProfit
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
            }`}>
            <AnimatedPercentage value={holding.gainLossPercentage} showSign={true} />
          </span>
        </div>
      </td>

      {/* Trend Sparkline */}
      <td className="px-4 py-4 text-center">
        <TrendSparkline isPositive={isProfit} />
      </td>

      {/* Portfolio % */}
      <td className="px-4 py-4">
        <PortfolioBar percentage={holding.portfolioPercentage} />
      </td>

      {/* Fundamentals */}
      <td className="px-4 py-4 text-right">
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex justify-end items-center gap-2">
            <span className="text-muted-foreground font-medium">P/E</span>
            <span className="font-semibold text-foreground min-w-[30px]">{holding.peRatio?.toFixed(1) ?? '-'}</span>
          </div>
          {holding.latestEarnings && (
            <div className="flex justify-end items-center gap-2">
              <span className="text-muted-foreground font-medium">EPS</span>
              <span className="font-semibold text-foreground min-w-[30px]">{holding.latestEarnings}</span>
            </div>
          )}
        </div>
      </td>

      {/* Actions - Added Buttons */}
      <td className="px-4 py-4 text-center">
        <div className="flex justify-center items-center gap-1 opacity-60 group-hover:opacity-100 transition-all duration-200">
          <button title="View Details" className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95">
            <Eye size={16} />
          </button>
          <button title="Buy" className="p-1.5 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95">
            <ShoppingCart size={16} />
          </button>
          <button title="Sell" className="p-1.5 text-red-600 dark:text-red-500 hover:bg-red-500/10 rounded-md transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95">
            <DollarSign size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
});

// Reuse existing HoldingCard logic but update styles
const HoldingCard = memo(function HoldingCard({ holding, isExpanded, onToggle }: { holding: Holding; isExpanded: boolean; onToggle: () => void }) {
  const isProfit = holding.gainLoss >= 0;

  return (
    <div className={`bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-primary shadow-lg' : 'shadow-sm hover:shadow-md'}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 text-left touch-manipulation cursor-pointer transition-all duration-200 hover:bg-secondary/30 active:bg-secondary/50"
      >
        {/* Simplified Mobile Card Layout for cleaner look */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <CompanyLogo name={holding.particulars} nseCode={holding.nseCode} size={40} />
            <div>
              <h4 className="font-semibold text-foreground text-sm">{holding.particulars}</h4>
              <p className="text-xs text-muted-foreground">{holding.quantity} qty</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-foreground text-sm"><AnimatedCurrency value={holding.presentValue} /></p>
            <p className={`text-xs font-medium ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isProfit ? '+' : ''}<AnimatedPercentage value={holding.gainLossPercentage} />
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>CMP: <AnimatedCurrency value={holding.cmp} className="text-foreground font-medium" /></span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-accent/50">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs mt-2">
            <div className="space-y-1">
              <p className="text-muted-foreground">Investment</p>
              <p className="font-medium text-foreground">{formatCurrency(holding.investment)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">P/L Amount</p>
              <p className={`font-medium ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                <AnimatedCurrency value={holding.gainLoss} />
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Portfolio %</p>
              <PortfolioBar percentage={holding.portfolioPercentage} />
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Fundamentals</p>
              <p className="text-foreground">P/E: {holding.peRatio?.toFixed(2) ?? '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-muted-foreground bg-card hover:bg-secondary transition-all duration-200 text-xs font-medium cursor-pointer hover:scale-105 active:scale-95">
              <Eye size={14} /> Details
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 transition-all duration-200 text-xs font-medium cursor-pointer hover:scale-105 active:scale-95">
              <ShoppingCart size={14} /> Buy
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/25 transition-all duration-200 text-xs font-medium cursor-pointer hover:scale-105 active:scale-95">
              <DollarSign size={14} /> Sell
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

function HoldingCardList({ holdings }: { holdings: Holding[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-3">
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

const SectorSummarySection = memo(function SectorSummarySection({ summary }: { summary: SectorSummary }) {
  const isProfit = summary.totalGainLoss >= 0;

  return (
    <div className="bg-accent border-t border-border px-6 py-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
      <div className="flex gap-8">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Total Investment</span>
          <span className="font-semibold text-foreground text-sm sm:text-base">{formatCurrency(summary.totalInvestment)}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Current Value</span>
          <span className="font-semibold text-foreground text-sm sm:text-base"><AnimatedCurrency value={summary.totalPresentValue} /></span>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-lg border border-border shadow-sm">
        <span className="text-xs font-medium text-muted-foreground">Sector P&L</span>
        <div className="h-4 w-px bg-border"></div>
        <span className={`font-bold text-sm ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {isProfit ? '+' : ''}<AnimatedCurrency value={summary.totalGainLoss} />
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isProfit ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>
          <AnimatedPercentage value={summary.gainLossPercentage} />
        </span>
      </div>
    </div>
  );
});

function SectorGroupComponent({ sector, holdings, summary }: SectorGroupProps) {
  if (holdings.length === 0) return null;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <SectorHeader sector={sector} holdingsCount={holdings.length} />

      {/* Mobile Card View */}
      <div className="md:hidden p-4">
        <HoldingCardList holdings={holdings} />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <HoldingsTableHeader />
            <tbody>
              {holdings.map((holding) => (
                <HoldingRow key={holding.id} holding={holding} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SectorSummarySection summary={summary} />
    </div>
  );
}

export const SectorGroup = memo(SectorGroupComponent);
export default SectorGroup;
