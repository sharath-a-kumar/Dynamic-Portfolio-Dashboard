'use client';

import { memo } from 'react';

interface GainLossIndicatorProps {
  value: number;
  percentage?: number;
  showArrow?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Google Finance style gain/loss indicator with colored arrows
 */
export const GainLossIndicator = memo(function GainLossIndicator({
  value,
  percentage,
  showArrow = true,
  size = 'md',
  className = '',
}: GainLossIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const colorClass = isPositive
    ? 'text-green-600 dark:text-green-400'
    : isNegative
    ? 'text-red-600 dark:text-red-400'
    : 'text-zinc-500 dark:text-zinc-400';

  const bgClass = isPositive
    ? 'bg-green-50 dark:bg-green-900/20'
    : isNegative
    ? 'bg-red-50 dark:bg-red-900/20'
    : 'bg-zinc-50 dark:bg-zinc-800';

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };

  const arrowSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const formatValue = (v: number) => {
    const sign = v > 0 ? '+' : '';
    return `${sign}₹${Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (p: number) => {
    const sign = p > 0 ? '+' : '';
    return `${sign}${p.toFixed(2)}%`;
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md ${sizeClasses[size]} ${colorClass} ${bgClass} ${className}`}
    >
      {showArrow && !isNeutral && (
        <svg
          className={`${arrowSizes[size]} ${isPositive ? 'rotate-0' : 'rotate-180'}`}
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
      <span>{formatValue(value)}</span>
      {percentage !== undefined && (
        <span className="opacity-80">({formatPercentage(percentage)})</span>
      )}
    </span>
  );
});

/**
 * Compact percentage change indicator (Google Finance style)
 */
export const PercentageChange = memo(function PercentageChange({
  value,
  showArrow = true,
  size = 'sm',
  className = '',
}: {
  value: number;
  showArrow?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const colorClass = isPositive
    ? 'text-green-600 dark:text-green-400'
    : isNegative
    ? 'text-red-600 dark:text-red-400'
    : 'text-zinc-500 dark:text-zinc-400';

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const arrowSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const formatPercentage = (p: number) => {
    const sign = p > 0 ? '+' : '';
    return `${sign}${p.toFixed(2)}%`;
  };

  return (
    <span className={`inline-flex items-center gap-0.5 font-medium ${sizeClasses[size]} ${colorClass} ${className}`}>
      {showArrow && value !== 0 && (
        <svg
          className={`${arrowSizes[size]} ${isPositive ? '' : 'rotate-180'}`}
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
      <span>{formatPercentage(value)}</span>
    </span>
  );
});

export default GainLossIndicator;
