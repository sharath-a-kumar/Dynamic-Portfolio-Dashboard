/**
 * Custom hook for detecting value changes and triggering animations
 * 
 * Provides smooth transition effects when numeric values update,
 * such as CMP, Present Value, and Gain/Loss.
 * 
 * Requirements: 2.3, 4.2, 4.3, 4.4 - UI updates reflect data changes with smooth transitions
 */

'use client';

import { useRef, useEffect, useState, useMemo } from 'react';

export type ValueChangeDirection = 'up' | 'down' | 'none';

export interface UseValueTransitionOptions {
  /**
   * Duration of the highlight animation in milliseconds (default: 1000)
   */
  animationDuration?: number;
  
  /**
   * Threshold for considering a value as "changed" (default: 0.001)
   * Helps avoid false positives from floating point precision issues
   */
  threshold?: number;
}

export interface UseValueTransitionReturn {
  /**
   * Whether the value has recently changed
   */
  hasChanged: boolean;
  
  /**
   * Direction of the change: 'up', 'down', or 'none'
   */
  direction: ValueChangeDirection;
  
  /**
   * CSS class to apply for the transition animation
   */
  transitionClass: string;
  
  /**
   * Previous value before the change (stored in state for safe access)
   */
  previousValue: number | null;
}

/**
 * Hook to track value changes and provide animation state
 * 
 * @param value - The current numeric value to track
 * @param options - Configuration options
 * @returns Object with change state and animation classes
 * 
 * @example
 * ```tsx
 * function PriceCell({ price }: { price: number }) {
 *   const { transitionClass, direction } = useValueTransition(price);
 *   
 *   return (
 *     <span className={transitionClass}>
 *       {formatCurrency(price)}
 *       {direction === 'up' && <ArrowUp />}
 *       {direction === 'down' && <ArrowDown />}
 *     </span>
 *   );
 * }
 * ```
 */
export function useValueTransition(
  value: number,
  options: UseValueTransitionOptions = {}
): UseValueTransitionReturn {
  const { animationDuration = 1000, threshold = 0.001 } = options;
  
  const previousValueRef = useRef<number>(value);
  const isFirstRenderRef = useRef(true);
  const [animationState, setAnimationState] = useState<{
    hasChanged: boolean;
    direction: ValueChangeDirection;
    previousValue: number | null;
  }>({
    hasChanged: false,
    direction: 'none',
    previousValue: null,
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Skip animation on initial render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousValueRef.current = value;
      return;
    }
    
    const prevValue = previousValueRef.current;
    const diff = value - prevValue;
    
    // Check if value has changed beyond threshold
    if (Math.abs(diff) > threshold) {
      setAnimationState({
        hasChanged: true,
        direction: diff > 0 ? 'up' : 'down',
        previousValue: prevValue,
      });
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Reset animation state after duration
      timeoutRef.current = setTimeout(() => {
        setAnimationState({
          hasChanged: false,
          direction: 'none',
          previousValue: null,
        });
      }, animationDuration);
    }
    
    previousValueRef.current = value;
  }, [value, animationDuration, threshold]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Generate CSS class based on change state
  const transitionClass = useMemo(() => {
    if (!animationState.hasChanged) return '';
    return animationState.direction === 'up'
      ? 'value-change-up'
      : animationState.direction === 'down'
        ? 'value-change-down'
        : '';
  }, [animationState.hasChanged, animationState.direction]);
  
  return {
    hasChanged: animationState.hasChanged,
    direction: animationState.direction,
    transitionClass,
    previousValue: animationState.previousValue,
  };
}

/**
 * Hook to track multiple values and their changes
 * Useful for tracking an entire holding's values at once
 */
export function useMultipleValueTransitions(
  values: Record<string, number>,
  options: UseValueTransitionOptions = {}
): Record<string, UseValueTransitionReturn> {
  const { animationDuration = 1000, threshold = 0.001 } = options;
  
  const previousValuesRef = useRef<Record<string, number>>({});
  const isFirstRenderRef = useRef(true);
  const [changes, setChanges] = useState<Record<string, { 
    hasChanged: boolean; 
    direction: ValueChangeDirection;
    previousValue: number | null;
  }>>({});
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Serialize values for dependency comparison
  const valuesKey = useMemo(() => JSON.stringify(values), [values]);
  
  useEffect(() => {
    // Skip animation on initial render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousValuesRef.current = { ...values };
      return;
    }
    
    const newChanges: Record<string, { 
      hasChanged: boolean; 
      direction: ValueChangeDirection;
      previousValue: number | null;
    }> = {};
    let hasNewChanges = false;
    
    for (const [key, value] of Object.entries(values)) {
      const prevValue = previousValuesRef.current[key];
      
      if (prevValue !== undefined) {
        const diff = value - prevValue;
        
        if (Math.abs(diff) > threshold) {
          hasNewChanges = true;
          newChanges[key] = {
            hasChanged: true,
            direction: diff > 0 ? 'up' : 'down',
            previousValue: prevValue,
          };
          
          // Clear existing timeout for this key
          if (timeoutsRef.current[key]) {
            clearTimeout(timeoutsRef.current[key]);
          }
          
          // Set timeout to reset this key's animation
          const timeoutKey = key;
          timeoutsRef.current[key] = setTimeout(() => {
            setChanges(prev => ({
              ...prev,
              [timeoutKey]: { hasChanged: false, direction: 'none', previousValue: null },
            }));
          }, animationDuration);
        }
      }
      
      previousValuesRef.current[key] = value;
    }
    
    if (hasNewChanges) {
      setChanges(prev => ({ ...prev, ...newChanges }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesKey, animationDuration, threshold]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    const currentTimeouts = timeoutsRef.current;
    return () => {
      Object.values(currentTimeouts).forEach(clearTimeout);
    };
  }, []);
  
  // Build return object from state (not refs)
  return useMemo(() => {
    const result: Record<string, UseValueTransitionReturn> = {};
    
    for (const key of Object.keys(values)) {
      const change = changes[key] || { hasChanged: false, direction: 'none' as ValueChangeDirection, previousValue: null };
      const transitionClass = change.hasChanged
        ? change.direction === 'up'
          ? 'value-change-up'
          : change.direction === 'down'
            ? 'value-change-down'
            : ''
        : '';
      
      result[key] = {
        hasChanged: change.hasChanged,
        direction: change.direction,
        transitionClass,
        previousValue: change.previousValue,
      };
    }
    
    return result;
  }, [values, changes]);
}

/**
 * Utility function to get transition class for a value change
 * Can be used without the hook for simpler cases
 */
export function getValueTransitionClass(
  currentValue: number,
  previousValue: number | null,
  threshold: number = 0.001
): string {
  if (previousValue === null) return '';
  
  const diff = currentValue - previousValue;
  
  if (Math.abs(diff) <= threshold) return '';
  
  return diff > 0 ? 'value-change-up' : 'value-change-down';
}
