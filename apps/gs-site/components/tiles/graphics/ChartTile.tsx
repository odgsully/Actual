'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export type ChartType = 'line' | 'bar' | 'area' | 'pie';

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartConfig {
  type: ChartType;
  dataKey?: string;
  xAxisKey?: string;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  curved?: boolean;
  innerRadius?: number; // For pie charts
  outerRadius?: number; // For pie charts
}

interface ChartTileProps {
  tile: Tile;
  data: ChartDataPoint[];
  config?: ChartConfig;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
  title?: string;
}

// Default colors for charts
const DEFAULT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
];

// ============================================================
// Chart Components
// ============================================================

function LineChartComponent({
  data,
  config,
}: {
  data: ChartDataPoint[];
  config: ChartConfig;
}) {
  const dataKey = config.dataKey || 'value';
  const xAxisKey = config.xAxisKey || 'name';
  const colors = config.colors || DEFAULT_COLORS;

  return (
    <LineChart data={data}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
      <XAxis
        dataKey={xAxisKey}
        tick={{ fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
      {config.showTooltip && (
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '11px',
          }}
        />
      )}
      {config.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
      <Line
        type={config.curved ? 'monotone' : 'linear'}
        dataKey={dataKey}
        stroke={colors[0]}
        strokeWidth={2}
        dot={{ r: 3 }}
        activeDot={{ r: 5 }}
      />
    </LineChart>
  );
}

function BarChartComponent({
  data,
  config,
}: {
  data: ChartDataPoint[];
  config: ChartConfig;
}) {
  const dataKey = config.dataKey || 'value';
  const xAxisKey = config.xAxisKey || 'name';
  const colors = config.colors || DEFAULT_COLORS;

  return (
    <BarChart data={data}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
      <XAxis
        dataKey={xAxisKey}
        tick={{ fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
      {config.showTooltip && (
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '11px',
          }}
        />
      )}
      {config.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
      <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
    </BarChart>
  );
}

function AreaChartComponent({
  data,
  config,
}: {
  data: ChartDataPoint[];
  config: ChartConfig;
}) {
  const dataKey = config.dataKey || 'value';
  const xAxisKey = config.xAxisKey || 'name';
  const colors = config.colors || DEFAULT_COLORS;

  return (
    <AreaChart data={data}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
      <XAxis
        dataKey={xAxisKey}
        tick={{ fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
      {config.showTooltip && (
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '11px',
          }}
        />
      )}
      {config.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
          <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <Area
        type={config.curved ? 'monotone' : 'linear'}
        dataKey={dataKey}
        stroke={colors[0]}
        strokeWidth={2}
        fill="url(#colorValue)"
      />
    </AreaChart>
  );
}

function PieChartComponent({
  data,
  config,
}: {
  data: ChartDataPoint[];
  config: ChartConfig;
}) {
  const dataKey = config.dataKey || 'value';
  const colors = config.colors || DEFAULT_COLORS;
  const innerRadius = config.innerRadius ?? 0;
  const outerRadius = config.outerRadius ?? 80;

  return (
    <PieChart>
      {config.showTooltip && (
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '11px',
          }}
        />
      )}
      {config.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
      <Pie
        data={data}
        dataKey={dataKey}
        nameKey="name"
        cx="50%"
        cy="50%"
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        paddingAngle={2}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        labelLine={false}
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
    </PieChart>
  );
}

// ============================================================
// Main Component
// ============================================================

/**
 * ChartTile - Generic Recharts wrapper for data visualizations
 *
 * Supports line, bar, area, and pie charts with consistent styling.
 * Lazy loaded to minimize bundle impact.
 *
 * @example
 * ```tsx
 * <ChartTile
 *   tile={tile}
 *   data={[{ name: 'Jan', value: 100 }, { name: 'Feb', value: 150 }]}
 *   config={{ type: 'line', showGrid: true, showTooltip: true }}
 * />
 * ```
 */
export function ChartTile({
  tile,
  data,
  config = { type: 'bar' },
  isLoading = false,
  error = null,
  onRetry,
  className,
  title,
}: ChartTileProps) {
  const chartConfig = useMemo(
    (): ChartConfig => ({
      showTooltip: true,
      showGrid: false,
      showLegend: false,
      curved: true,
      ...config,
      type: config.type || 'bar',
    }),
    [config]
  );

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    min-h-[10rem]
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  const renderChart = () => {
    switch (chartConfig.type) {
      case 'line':
        return <LineChartComponent data={data} config={chartConfig} />;
      case 'area':
        return <AreaChartComponent data={data} config={chartConfig} />;
      case 'pie':
        return <PieChartComponent data={data} config={chartConfig} />;
      case 'bar':
      default:
        return <BarChartComponent data={data} config={chartConfig} />;
    }
  };

  return (
    <WarningBorderTrail active={tile.actionWarning} hoverMessage={tile.actionDesc}>
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-foreground truncate">
            {title || tile.name}
          </h3>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Chart area */}
        <div className="flex-1 min-h-[6rem]">
          {isLoading && (
            <div className="h-full flex items-center justify-center">
              <div className="space-y-2 animate-pulse w-full">
                <div className="h-full bg-muted rounded" />
              </div>
            </div>
          )}

          {error && (
            <div className="h-full flex flex-col items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500 mb-1" />
              <p className="text-xs text-muted-foreground mb-2">Chart unavailable</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs text-primary hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && data.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          )}

          {!isLoading && !error && data.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No data</p>
            </div>
          )}
        </div>

        {/* Status indicator */}
        {tile.status && tile.status !== 'Not started' && (
          <div
            className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
              tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        )}
      </div>
    </WarningBorderTrail>
  );
}

export default ChartTile;
