'use client';

import { memo } from 'react';

/**
 * Skeleton loader for metric cards
 */
const MetricCardSkeleton = memo(function MetricCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div 
      className="bg-card border border-border rounded-xl p-4 sm:p-5 animate-pulse"
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded-lg" />
      </div>
      <div className="h-8 w-32 bg-muted rounded mb-2" />
      <div className="h-3 w-20 bg-muted rounded" />
    </div>
  );
});

/**
 * Skeleton loader for charts section
 */
const ChartsSkeleton = memo(function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Pie Chart Skeleton */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="flex items-center justify-center h-64">
          <div className="w-48 h-48 rounded-full bg-muted relative">
            <div className="absolute inset-4 rounded-full bg-card" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart Skeleton */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded mb-4" />
        <div className="flex items-end justify-around h-64 px-4">
          {[40, 65, 45, 80, 55, 70].map((height, i) => (
            <div 
              key={i} 
              className="w-8 sm:w-12 bg-muted rounded-t"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="flex justify-around mt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 w-8 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  );
});

/**
 * Skeleton loader for sector group/table
 */
const SectorGroupSkeleton = memo(function SectorGroupSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border animate-pulse">
      {/* Header */}
      <div className="px-4 py-3 bg-secondary border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-muted rounded" />
          <div className="h-5 w-32 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
      </div>
      
      {/* Table Header */}
      <div className="hidden sm:grid grid-cols-8 gap-4 px-4 py-2 bg-muted/50 text-xs">
        {['Stock', 'Qty', 'Avg Price', 'CMP', 'Investment', 'Value', 'P&L', 'P&L %'].map((_, i) => (
          <div key={i} className="h-3 bg-muted rounded w-full" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-8 gap-2 sm:gap-4 px-4 py-3">
            <div className="col-span-2 sm:col-span-1">
              <div className="h-4 w-full bg-muted rounded mb-1" />
              <div className="h-3 w-2/3 bg-muted rounded sm:hidden" />
            </div>
            {[...Array(7)].map((_, j) => (
              <div key={j} className="hidden sm:block h-4 bg-muted rounded" />
            ))}
            <div className="sm:hidden h-4 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-secondary border-t border-border flex justify-between">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    </div>
  );
});

/**
 * Full dashboard skeleton that mimics the actual layout
 */
export const SkeletonDashboard = memo(function SkeletonDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <MetricCardSkeleton delay={0} />
        <MetricCardSkeleton delay={1} />
        <MetricCardSkeleton delay={2} />
        <MetricCardSkeleton delay={3} />
      </div>

      {/* Charts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </div>
        <ChartsSkeleton />
      </div>

      {/* Holdings Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-44 bg-muted rounded animate-pulse" />
        </div>
        <SectorGroupSkeleton rows={4} />
        <SectorGroupSkeleton rows={3} />
        <SectorGroupSkeleton rows={2} />
      </div>
    </div>
  );
});

export { MetricCardSkeleton, ChartsSkeleton, SectorGroupSkeleton };
export default SkeletonDashboard;
