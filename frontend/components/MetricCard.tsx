'use client';

import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { AnimatedCurrency, AnimatedPercentage } from './AnimatedValue';

interface MetricCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  trend?: number;
  icon: any; // Lucide Icon
  gradientBorder?: string; // CSS class for gradient border
  delay?: number;
}

export function MetricCard({ 
  title, 
  value, 
  isCurrency = true, 
  trend, 
  icon: Icon,
  gradientBorder = "border-l-4 border-l-primary",
  delay = 0 
}: MetricCardProps) {
  
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className={`relative group bg-card rounded-xl p-3 sm:p-5 overflow-hidden hover-lift border border-border shadow-sm cursor-default ${gradientBorder}`}
    >
      {/* Background Gradient Glow - Light mode aware */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
      
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className="p-2 sm:p-2.5 bg-secondary rounded-lg text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 group-hover:scale-110">
          <Icon size={18} className="sm:w-5 sm:h-5" />
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${
            isPositive 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
          }`}>
             {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(2)}%
          </div>
        )}
      </div>
      
      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-1.5">{title}</h3>
      
      <div className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
        {isCurrency ? (
          <AnimatedCurrency value={value} />
        ) : (
          <AnimatedPercentage value={value} />
        )}
      </div>
    </motion.div>
  );
}
