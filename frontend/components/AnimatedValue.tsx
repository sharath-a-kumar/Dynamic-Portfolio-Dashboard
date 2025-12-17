/**
 * AnimatedValue Component
 * 
 * Displays a numeric value with smooth transition animations when the value changes.
 * Shows a brief highlight effect and optional direction indicator.
 * 
 * Requirements:
 * - 2.3: CMP data updates trigger UI updates
 * - 4.2: Present Value recalculates when CMP updates
 * - 4.3: Gain/Loss recalculates when Present Value updates
 * - 4.4: UI updates without full page reload
 */

'use client';

import { memo } from 'react';
import { useValueTransition } from '@/hooks';

export interface AnimatedValueProps {
  /**
   * The numeric value to display
   */
  value: number;
  
  /**
   * Function to format the value for display
   */
  formatter?: (value: number) => string;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * Whether to show direction indicator arrows
   */
  showDirectionIndicator?: boolean;
  
  /**
   * Duration of the animation in milliseconds
   */
  animationDuration?: number;
  
  /**
   * Unique identifier for the value (helps with tracking)
   */
  id?: string;
}

/**
 * Default formatter for currency values in Indian Rupees
 */
function defaultFormatter(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/**
 * Direction indicator arrow component
 */
function DirectionArrow({ direction }: { direction: 'up' | 'down' | 'none' }) {
  if (direction === 'none') return null;
  
  return (
    <span 
      className={`inline-block ml-1 text-xs ${direction === 'up' ? 'value-arrow-up' : 'value-arrow-down'}`}
      aria-hidden="true"
    >
      {direction === 'up' ? '▲' : '▼'}
    </span>
  );
}

/**
 * AnimatedValue Component
 * 
 * Renders a numeric value with smooth transition animations when the value changes.
 * The component highlights briefly in green (for increases) or red (for decreases)
 * and optionally shows a direction indicator arrow.
 * 
 * @example
 * ```tsx
 * // Basic usage with currency formatting
 * <AnimatedValue value={1234.56} />
 * 
 * // With custom formatter and direction indicator
 * <AnimatedValue 
 *   value={holding.cmp} 
 *   formatter={(v) => `₹${v.toFixed(2)}`}
 *   showDirectionIndicator={true}
 * />
 * 
 * // With custom styling
 * <AnimatedValue 
 *   value={holding.gainLoss} 
 *   className="font-bold text-lg"
 * />
 * ```
 */
export const AnimatedValue = memo(function AnimatedValue({
  value,
  formatter = defaultFormatter,
  className = '',
  showDirectionIndicator = false,
  animationDuration = 1000,
}: AnimatedValueProps) {
  const { transitionClass, direction } = useValueTransition(value, { animationDuration });
  
  return (
    <span 
      className={`value-transition ${transitionClass} ${className}`.trim()}
      data-value={value}
    >
      {formatter(value)}
      {showDirectionIndicator && <DirectionArrow direction={direction} />}
    </span>
  );
});

/**
 * AnimatedPercentage Component
 * 
 * Specialized version of AnimatedValue for percentage values.
 */
export const AnimatedPercentage = memo(function AnimatedPercentage({
  value,
  className = '',
  showSign = false,
  showDirectionIndicator = false,
  animationDuration = 1000,
}: {
  value: number;
  className?: string;
  showSign?: boolean;
  showDirectionIndicator?: boolean;
  animationDuration?: number;
}) {
  const formatter = (v: number) => {
    const sign = showSign && v > 0 ? '+' : '';
    return `${sign}${v.toFixed(2)}%`;
  };
  
  return (
    <AnimatedValue
      value={value}
      formatter={formatter}
      className={className}
      showDirectionIndicator={showDirectionIndicator}
      animationDuration={animationDuration}
    />
  );
});

/**
 * AnimatedCurrency Component
 * 
 * Specialized version of AnimatedValue for currency values in Indian Rupees.
 */
export const AnimatedCurrency = memo(function AnimatedCurrency({
  value,
  className = '',
  showDirectionIndicator = false,
  animationDuration = 1000,
}: {
  value: number;
  className?: string;
  showDirectionIndicator?: boolean;
  animationDuration?: number;
}) {
  return (
    <AnimatedValue
      value={value}
      formatter={defaultFormatter}
      className={className}
      showDirectionIndicator={showDirectionIndicator}
      animationDuration={animationDuration}
    />
  );
});

export default AnimatedValue;
