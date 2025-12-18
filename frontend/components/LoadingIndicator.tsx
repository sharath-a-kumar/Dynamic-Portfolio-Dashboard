/**
 * LoadingIndicator Component
 * 
 * Provides various loading state indicators for the portfolio dashboard:
 * - Global loading bar at the top of the page
 * - Overlay for refresh operations
 * - Inline spinner for buttons and actions
 * 
 * Requirements: 10.5 - Display initial data within 3 seconds under normal conditions
 */

'use client';

import { memo } from 'react';

export interface LoadingBarProps {
  /**
   * Whether the loading bar is visible
   */
  isLoading: boolean;
  
  /**
   * Color variant for the loading bar
   */
  variant?: 'primary' | 'success' | 'warning';
}

/**
 * Global loading bar that appears at the top of the page
 * Shows a smooth animated progress bar during data fetching
 */
export const LoadingBar = memo(function LoadingBar({ 
  isLoading, 
  variant = 'primary' 
}: LoadingBarProps) {
  if (!isLoading) return null;
  
  const colorClasses = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
      <div 
        className={`h-full ${colorClasses[variant]} animate-loading-bar`}
        role="progressbar"
        aria-label="Loading"
        aria-busy="true"
      />
    </div>
  );
});

export interface LoadingOverlayProps {
  /**
   * Whether the overlay is visible
   */
  isVisible: boolean;
  
  /**
   * Optional message to display
   */
  message?: string;
  
  /**
   * Whether to show a subtle or prominent overlay
   */
  subtle?: boolean;
}

/**
 * Loading overlay that appears over content during refresh
 * Provides visual feedback without blocking interaction
 */
export const LoadingOverlay = memo(function LoadingOverlay({ 
  isVisible, 
  message = 'Updating...',
  subtle = true,
}: LoadingOverlayProps) {
  if (!isVisible) return null;
  
  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
        subtle 
          ? 'bg-white/30 dark:bg-zinc-900/30 backdrop-blur-[1px]' 
          : 'bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">{message}</span>
      </div>
    </div>
  );
});

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Inline loading spinner for buttons and actions
 */
export const LoadingSpinner = memo(function LoadingSpinner({ 
  size = 'md',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  return (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24" 
      fill="none"
      aria-hidden="true"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
      />
    </svg>
  );
});

export interface SkeletonProps {
  /**
   * Width of the skeleton (CSS value or Tailwind class)
   */
  width?: string;
  
  /**
   * Height of the skeleton (CSS value or Tailwind class)
   */
  height?: string;
  
  /**
   * Whether to use rounded corners
   */
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Generic skeleton placeholder for loading states
 */
export const Skeleton = memo(function Skeleton({
  width = 'w-full',
  height = 'h-4',
  rounded = 'md',
  className = '',
}: SkeletonProps) {
  const roundedClasses = {
    true: 'rounded',
    false: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };
  
  const roundedClass = typeof rounded === 'boolean' 
    ? roundedClasses[rounded.toString() as 'true' | 'false']
    : roundedClasses[rounded];
  
  return (
    <div 
      className={`animate-pulse bg-zinc-200 dark:bg-zinc-700 ${width} ${height} ${roundedClass} ${className}`}
      aria-hidden="true"
    />
  );
});

/**
 * Skeleton text line for loading states
 */
export const SkeletonText = memo(function SkeletonText({
  lines = 1,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'} 
          height="h-4" 
        />
      ))}
    </div>
  );
});

/**
 * Content wrapper that handles smooth transitions from loading to loaded state
 * Requirements: 10.5 - Ensure smooth transition from loading to loaded state
 */
export const LoadingTransition = memo(function LoadingTransition({
  isLoading,
  children,
  skeleton,
  className = '',
}: {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Skeleton - fades out when loaded */}
      <div 
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
        }`}
      >
        {skeleton}
      </div>
      
      {/* Content - fades in when loaded */}
      <div 
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {children}
      </div>
    </div>
  );
});

export default LoadingSpinner;
