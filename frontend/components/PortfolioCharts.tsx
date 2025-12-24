'use client';

import { useMemo, useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Holding } from '@/types';

// Hook to detect current theme
function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

// Premium colors for charts
const COLORS = [
  '#6366f1', // Indigo-500
  '#ec4899', // Pink-500
  '#8b5cf6', // Violet-500
  '#10b981', // Emerald-500
  '#f59e0b', // Amber-500
  '#3b82f6', // Blue-500
  '#ef4444', // Red-500
  '#14b8a6', // Teal-500
];

const SimpleCard = ({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`bg-card border border-border rounded-xl shadow-sm overflow-hidden ${className} hover-lift`}
  >
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
      <h3 className="text-base sm:text-lg font-bold text-foreground">{title}</h3>
    </div>
    <div className="p-3 sm:p-6">{children}</div>
  </motion.div>
);

interface PortfolioChartsProps {
  holdings: Holding[];
}

export function PortfolioCharts({ holdings }: PortfolioChartsProps) {
  const isDark = useTheme();

  // Theme-aware tooltip styles
  const tooltipStyle = {
    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    borderColor: isDark ? '#333333' : '#e2e8f0',
    borderRadius: '12px',
    color: isDark ? '#fafafa' : '#0f172a',
    boxShadow: isDark
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  };

  const gridColor = isDark ? '#333333' : '#e2e8f0';
  const axisTextColor = isDark ? '#a1a1aa' : '#64748b';

  // 1. Sector Allocation (Donut Chart)
  const sectorData = useMemo(() => {
    const map = new Map<string, number>();
    let totalValue = 0;
    holdings.forEach((h) => {
      const current = map.get(h.sector) || 0;
      map.set(h.sector, current + h.presentValue);
      totalValue += h.presentValue;
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: ((value / totalValue) * 100).toFixed(0) + '%',
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  // 2. Investment vs Current Value by Sector
  const sectorComparison = useMemo(() => {
    const sectorMap = new Map<string, { investment: number; current: number }>();
    holdings.forEach((h) => {
      const existing = sectorMap.get(h.sector) || { investment: 0, current: 0 };
      sectorMap.set(h.sector, {
        investment: existing.investment + h.investment,
        current: existing.current + h.presentValue,
      });
    });

    return Array.from(sectorMap.entries())
      .map(([name, data]) => ({
        name,
        Investment: data.investment,
        Current: data.current,
      }))
      .sort((a, b) => b.Current - a.Current);
  }, [holdings]);

  // 3. Top Gainers & Losers
  const topGainersLosers = useMemo(() => {
    const sorted = [...holdings].sort(
      (a, b) => b.gainLossPercentage - a.gainLossPercentage
    );
    const gainers = sorted.slice(0, 3).map((h) => ({
      name: h.nseCode,
      fullName: h.particulars,
      value: Number(h.gainLossPercentage.toFixed(2)),
      amount: h.gainLoss,
      isGainer: true,
    }));
    const losers = sorted
      .slice(-3)
      .reverse()
      .map((h) => ({
        name: h.nseCode,
        fullName: h.particulars,
        value: Number(h.gainLossPercentage.toFixed(2)),
        amount: h.gainLoss,
        isGainer: false,
      }));
    return { gainers, losers };
  }, [holdings]);

  // 4. Holdings by Value (Top 5)
  const topHoldingsByValue = useMemo(() => {
    return [...holdings]
      .sort((a, b) => b.presentValue - a.presentValue)
      .slice(0, 5)
      .map((h, index) => ({
        name: h.particulars?.substring(0, 12) || h.nseCode || 'Unknown',
        fullName: h.particulars || h.nseCode || 'Unknown',
        code: h.nseCode,
        value: h.presentValue,
        fill: COLORS[index % COLORS.length],
      }));
  }, [holdings]);

  // 5. P/E Ratio Distribution
  const peDistribution = useMemo(() => {
    const withPE = holdings.filter((h) => h.peRatio !== null && h.peRatio > 0);
    const ranges = [
      { range: '0-15', min: 0, max: 15, count: 0, label: 'Value (<15)' },
      { range: '15-25', min: 15, max: 25, count: 0, label: 'Fair (15-25)' },
      { range: '25-40', min: 25, max: 40, count: 0, label: 'Growth (25-40)' },
      { range: '40+', min: 40, max: Infinity, count: 0, label: 'Premium (>40)' },
    ];

    withPE.forEach((h) => {
      const pe = h.peRatio!;
      for (const r of ranges) {
        if (pe >= r.min && pe < r.max) {
          r.count++;
          break;
        }
      }
    });

    return ranges.map((r, i) => ({
      name: r.range,
      label: r.label,
      value: r.count,
      fill: COLORS[i + 3] || COLORS[i], // Use different color set
    }));
  }, [holdings]);

  // 6. Portfolio Concentration (Radial)
  const portfolioConcentration = useMemo(() => {
    const totalValue = holdings.reduce((sum, h) => sum + h.presentValue, 0);
    const sorted = [...holdings].sort((a, b) => b.presentValue - a.presentValue);

    let top3Value = 0;
    let top5Value = 0;
    sorted.forEach((h, i) => {
      if (i < 3) top3Value += h.presentValue;
      if (i < 5) top5Value += h.presentValue;
    });

    return [
      {
        name: 'Top 3',
        value: Number(((top3Value / totalValue) * 100).toFixed(1)),
        fill: '#6366f1',
      },
      {
        name: 'Top 5',
        value: Number(((top5Value / totalValue) * 100).toFixed(1)),
        fill: '#8b5cf6',
      },
      {
        name: 'Others',
        value: Number((((totalValue - top5Value) / totalValue) * 100).toFixed(1)),
        fill: '#e2e8f0',
      },
    ];
  }, [holdings]);

  if (!holdings || holdings.length === 0) return null;

  // Custom legend for Donut chart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderDonutLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full mr-2 shrink-0"
              style={{ backgroundColor: entry.color }}
            ></span>
            <span className="text-muted-foreground">{entry.payload.name}</span>
            <span className="font-semibold ml-1.5 text-foreground">
              {entry.payload.percentage}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {/* 1. Sector Allocation - Donut Chart */}
      <SimpleCard title="Sector Allocation">
        <div className="h-[250px] sm:h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="42%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {sectorData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, _name: any, props: any) => [
                  `₹${Number(value).toLocaleString()} (${props.payload.percentage})`,
                  'Value',
                ]}
                itemStyle={{ color: isDark ? '#fafafa' : '#0f172a' }}
              />
              <Legend content={renderDonutLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </SimpleCard>

      {/* 2. Investment vs Current - Grouped Bar */}
      <SimpleCard title="Invested vs Current">
        <div className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sectorComparison.slice(0, 4)}
              margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridColor}
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: axisTextColor }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                cursor={{
                  fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }}
                contentStyle={tooltipStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [
                  `₹${Number(value).toLocaleString()}`,
                  '',
                ]}
                itemStyle={{ color: isDark ? '#fafafa' : '#0f172a' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value) => (
                  <span className="text-muted-foreground">{value}</span>
                )}
              />
              <Bar
                dataKey="Current"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                name="Current"
              />
              <Bar
                dataKey="Investment"
                fill={isDark ? '#64748b' : '#94a3b8'}
                radius={[6, 6, 0, 0]}
                name="Invested"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SimpleCard>

      {/* 3. Top Gainers & Losers */}
      <SimpleCard title="Top Gainers & Losers">
        <div className="h-auto sm:h-[300px] w-full flex flex-col justify-start overflow-y-auto">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Top Gainers
            </p>
            {topGainersLosers.gainers.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-emerald-500 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-medium text-xs sm:text-sm text-foreground truncate" title={item.fullName}>
                    {item.fullName || item.name || 'Unknown'}
                  </span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm shrink-0 ml-2">
                  +{item.value}%
                </span>
              </div>
            ))}

            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mt-3">
              Top Losers
            </p>
            {topGainersLosers.losers
              .filter((l) => l.value < 0)
              .slice(0, 3)
              .map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-red-50 dark:bg-red-500/10"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-red-500 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-xs sm:text-sm text-foreground truncate" title={item.fullName}>
                      {item.fullName || item.name || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm shrink-0 ml-2">
                    {item.value}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </SimpleCard>

      {/* 4. Top Holdings by Value */}
      <SimpleCard title="Top 5 Holdings">
        <div className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topHoldingsByValue}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 60, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                stroke={gridColor}
                opacity={0.5}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: axisTextColor }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: axisTextColor }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, _name: any, props: any) => [
                  `₹${Number(value).toLocaleString()}`,
                  props.payload.fullName,
                ]}
                itemStyle={{ color: isDark ? '#fafafa' : '#0f172a' }}
                labelFormatter={() => ''}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {topHoldingsByValue.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SimpleCard>

      {/* 5. P/E Ratio Distribution */}
      <SimpleCard title="P/E Ratio Distribution">
        <div className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={peDistribution}
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridColor}
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: axisTextColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: axisTextColor }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, _name: any, props: any) => [
                  `${value} stocks`,
                  props.payload.label,
                ]}
                itemStyle={{ color: isDark ? '#fafafa' : '#0f172a' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {peDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2">
            {peDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.fill }}
                ></span>
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </SimpleCard>

      {/* 6. Portfolio Concentration */}
      <SimpleCard title="Portfolio Concentration">
        <div className="h-auto sm:h-[300px] w-full flex flex-col items-center justify-center">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
            {portfolioConcentration.slice(0, 2).map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center p-2 sm:p-4 rounded-xl bg-secondary/50"
              >
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-1 sm:mb-2"
                  style={{
                    background: `conic-gradient(${item.fill} ${item.value * 3.6}deg, ${isDark ? '#333' : '#e2e8f0'} 0deg)`,
                  }}
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-card flex items-center justify-center">
                    <span className="text-sm sm:text-lg font-bold text-foreground">
                      {item.value}%
                    </span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  {item.name}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">Holdings</span>
              </div>
            ))}
            <div className="flex flex-col items-center p-2 sm:p-4 rounded-xl bg-secondary/50">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-1 sm:mb-2 bg-gradient-to-br from-indigo-500 to-purple-500">
                <span className="text-sm sm:text-lg font-bold text-white">
                  {holdings.length}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground">Total</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Stocks</span>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 w-full">
            <div className="flex items-center justify-between text-[10px] sm:text-xs mb-2">
              <span className="text-muted-foreground">Diversification</span>
              <span className="font-semibold text-foreground">
                {portfolioConcentration[0].value < 50 ? 'Good' : 'Concentrated'}
              </span>
            </div>
            <div className="h-1.5 sm:h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${100 - portfolioConcentration[0].value}%`,
                  background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
                }}
              />
            </div>
          </div>
        </div>
      </SimpleCard>
    </div>
  );
}
