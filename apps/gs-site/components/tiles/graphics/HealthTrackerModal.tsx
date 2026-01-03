'use client';

import { useState, useMemo } from 'react';
import {
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Activity,
  Zap,
  Moon,
  Link2,
  Info,
} from 'lucide-react';
import { useWhoopHistorical, useConnectWhoop, useWhoopConnection, type WhoopChartDataPoint } from '@/hooks/useWhoopData';

interface HealthTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TimeRange = 7 | 14 | 30;

/**
 * Parse date string robustly - handles ISO strings, YYYY-MM-DD, timestamps, etc.
 */
function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;

  // Try parsing directly first (handles ISO strings like "2024-01-15T08:00:00.000Z")
  let date = new Date(dateStr);

  // If invalid and looks like YYYY-MM-DD, add time component
  if (isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    date = new Date(dateStr + 'T12:00:00');
  }

  // Return null if still invalid
  if (isNaN(date.getTime())) return null;

  return date;
}

/**
 * Format date for display (e.g., "Mon 12/30")
 */
function formatDisplayDate(dateStr: string | undefined | null): string {
  const date = parseDate(dateStr);
  if (!date) return '—';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[date.getDay()];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${dayName} ${month}/${day}`;
}

/**
 * Format short date (e.g., "12/30")
 */
function formatShortDate(dateStr: string | undefined | null): string {
  const date = parseDate(dateStr);
  if (!date) return '—';

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

/**
 * Get color for recovery score
 */
function getRecoveryColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 67) return { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500' };
  if (score >= 34) return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500' };
  return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500' };
}

/**
 * Get recovery zone label
 */
function getRecoveryZone(score: number): string {
  if (score >= 67) return 'Green Zone';
  if (score >= 34) return 'Yellow Zone';
  return 'Red Zone';
}

/**
 * Calculate trend from data points
 */
function calculateTrend(
  data: WhoopChartDataPoint[],
  metric: 'recovery' | 'hrv' | 'rhr'
): { trend: 'improving' | 'declining' | 'stable'; diff: number } {
  const validData = data.filter((d) => {
    const val = metric === 'recovery' ? d.recovery : metric === 'hrv' ? d.hrv : d.rhr;
    return val !== null && val > 0;
  });

  if (validData.length < 4) return { trend: 'stable', diff: 0 };

  const recent = validData.slice(-3);
  const earlier = validData.slice(-6, -3);
  if (earlier.length === 0) return { trend: 'stable', diff: 0 };

  const getValue = (d: WhoopChartDataPoint) =>
    metric === 'recovery' ? d.recovery : metric === 'hrv' ? (d.hrv ?? 0) : (d.rhr ?? 0);

  const recentAvg = recent.reduce((s, d) => s + getValue(d), 0) / recent.length;
  const earlierAvg = earlier.reduce((s, d) => s + getValue(d), 0) / earlier.length;
  const diff = recentAvg - earlierAvg;

  // For RHR, lower is better
  if (metric === 'rhr') {
    if (diff < -2) return { trend: 'improving', diff };
    if (diff > 2) return { trend: 'declining', diff };
  } else {
    if (diff > 5) return { trend: 'improving', diff };
    if (diff < -5) return { trend: 'declining', diff };
  }

  return { trend: 'stable', diff };
}

/**
 * Interactive SVG Line Chart
 */
function LineChart({
  data,
  metric,
  color,
  yMin,
  yMax,
  unit,
  height = 160,
}: {
  data: WhoopChartDataPoint[];
  metric: 'recovery' | 'hrv' | 'rhr' | 'strain';
  color: string;
  yMin: number;
  yMax: number;
  unit: string;
  height?: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 600;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getValue = (d: WhoopChartDataPoint) => {
    switch (metric) {
      case 'recovery':
        return d.recovery;
      case 'hrv':
        return d.hrv ?? 0;
      case 'rhr':
        return d.rhr ?? 0;
      case 'strain':
        return d.strain ?? 0;
    }
  };

  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
      const val = getValue(d);
      const y = padding.top + chartHeight - ((val - yMin) / (yMax - yMin)) * chartHeight;
      return { x, y, value: val, date: d.date };
    });
  }, [data, chartWidth, chartHeight, yMin, yMax, metric]);

  // Build SVG path
  const pathD =
    points.length > 1
      ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
      : '';

  // Build area path
  const areaD =
    points.length > 1
      ? `M ${padding.left},${padding.top + chartHeight} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${
          points[points.length - 1].x
        },${padding.top + chartHeight} Z`
      : '';

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => yMin + (i / (yTicks - 1)) * (yMax - yMin));

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${metric}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTickValues.map((tick, i) => {
        const y = padding.top + chartHeight - ((tick - yMin) / (yMax - yMin)) * chartHeight;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
            />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-muted-foreground">
              {Math.round(tick)}
            </text>
          </g>
        );
      })}

      {/* X-axis labels (show every N labels based on data length) */}
      {data.map((d, i) => {
        const showLabel = data.length <= 10 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1;
        if (!showLabel) return null;
        const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
        return (
          <text
            key={i}
            x={x}
            y={height - 10}
            textAnchor="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {formatShortDate(d.date)}
          </text>
        );
      })}

      {/* Area fill */}
      <path d={areaD} fill={`url(#gradient-${metric})`} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((point, i) => (
        <g key={i}>
          <circle
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === i ? 6 : 4}
            fill={color}
            stroke="white"
            strokeWidth="2"
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        </g>
      ))}

      {/* Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <g>
          <rect
            x={points[hoveredIndex].x - 35}
            y={points[hoveredIndex].y - 40}
            width="70"
            height="30"
            rx="4"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
          />
          <text
            x={points[hoveredIndex].x}
            y={points[hoveredIndex].y - 27}
            textAnchor="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {formatShortDate(points[hoveredIndex].date)}
          </text>
          <text
            x={points[hoveredIndex].x}
            y={points[hoveredIndex].y - 15}
            textAnchor="middle"
            className="text-xs font-bold fill-foreground"
          >
            {Math.round(points[hoveredIndex].value)}
            {unit}
          </text>
        </g>
      )}

      {/* Y-axis label */}
      <text
        x={12}
        y={height / 2}
        textAnchor="middle"
        transform={`rotate(-90, 12, ${height / 2})`}
        className="text-[10px] fill-muted-foreground"
      >
        {unit}
      </text>
    </svg>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  colorClass,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: number | null;
  unit: string;
  trend?: { trend: 'improving' | 'declining' | 'stable'; diff: number };
  colorClass: string;
  subtitle?: string;
}) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend.trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground">{value !== null ? Math.round(value) : '—'}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {getTrendIcon()}
          <span className="text-xs text-muted-foreground capitalize">
            {trend.trend} ({trend.diff > 0 ? '+' : ''}
            {Math.round(trend.diff)})
          </span>
        </div>
      )}
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

/**
 * Insight Card Component
 */
function InsightCard({ title, description, type }: { title: string; description: string; type: 'positive' | 'warning' | 'info' }) {
  const colors = {
    positive: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
  };
  const icons = {
    positive: <TrendingUp className="w-4 h-4 text-green-500" />,
    warning: <AlertCircle className="w-4 h-4 text-yellow-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div className={`border rounded-lg p-3 ${colors[type]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icons[type]}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function HealthTrackerModal({ isOpen, onClose }: HealthTrackerModalProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [activeTab, setActiveTab] = useState<'overview' | 'recovery' | 'hrv' | 'data'>('overview');

  const { isConnected, isLoading: isCheckingConnection } = useWhoopConnection();
  const { connect, isConnecting } = useConnectWhoop();

  const {
    data: historicalData,
    isLoading,
    error,
    refetch,
  } = useWhoopHistorical(timeRange, { enabled: isConnected && isOpen });

  const chartData = historicalData?.chartData ?? [];

  // Calculate metrics
  const metrics = useMemo(() => {
    const validRecoveries = chartData.filter((d) => d.recovery > 0);
    const validHrvs = chartData.filter((d) => d.hrv !== null && d.hrv > 0);
    const validRhrs = chartData.filter((d) => d.rhr !== null && d.rhr > 0);
    const validStrains = chartData.filter((d) => d.strain !== null);

    return {
      avgRecovery:
        validRecoveries.length > 0
          ? Math.round(validRecoveries.reduce((s, d) => s + d.recovery, 0) / validRecoveries.length)
          : null,
      avgHrv:
        validHrvs.length > 0 ? Math.round(validHrvs.reduce((s, d) => s + (d.hrv ?? 0), 0) / validHrvs.length) : null,
      avgRhr:
        validRhrs.length > 0 ? Math.round(validRhrs.reduce((s, d) => s + (d.rhr ?? 0), 0) / validRhrs.length) : null,
      avgStrain:
        validStrains.length > 0
          ? Math.round(validStrains.reduce((s, d) => s + (d.strain ?? 0), 0) / validStrains.length * 10) / 10
          : null,
      maxRecovery: validRecoveries.length > 0 ? Math.max(...validRecoveries.map((d) => d.recovery)) : null,
      minRecovery: validRecoveries.length > 0 ? Math.min(...validRecoveries.map((d) => d.recovery)) : null,
      greenDays: validRecoveries.filter((d) => d.recovery >= 67).length,
      yellowDays: validRecoveries.filter((d) => d.recovery >= 34 && d.recovery < 67).length,
      redDays: validRecoveries.filter((d) => d.recovery < 34).length,
      recoveryTrend: calculateTrend(chartData, 'recovery'),
      hrvTrend: calculateTrend(chartData, 'hrv'),
      rhrTrend: calculateTrend(chartData, 'rhr'),
    };
  }, [chartData]);

  // Generate insights based on data
  const insights = useMemo(() => {
    const result: { title: string; description: string; type: 'positive' | 'warning' | 'info' }[] = [];

    if (metrics.avgRecovery !== null) {
      if (metrics.avgRecovery >= 67) {
        result.push({
          title: 'Strong Recovery',
          description: `Your ${timeRange}-day average recovery is ${metrics.avgRecovery}%, which is in the green zone. Your body is well-rested.`,
          type: 'positive',
        });
      } else if (metrics.avgRecovery < 34) {
        result.push({
          title: 'Low Recovery Period',
          description: `Your ${timeRange}-day average recovery is ${metrics.avgRecovery}%. Consider prioritizing sleep and reducing strain.`,
          type: 'warning',
        });
      }
    }

    if (metrics.recoveryTrend.trend === 'improving') {
      result.push({
        title: 'Upward Trend',
        description: 'Your recovery has been improving over the recent days. Keep up the good habits!',
        type: 'positive',
      });
    } else if (metrics.recoveryTrend.trend === 'declining') {
      result.push({
        title: 'Recovery Declining',
        description: 'Your recovery has been trending down. Consider getting more sleep or reducing training load.',
        type: 'warning',
      });
    }

    if (metrics.greenDays > 0) {
      const percentage = Math.round((metrics.greenDays / chartData.length) * 100);
      result.push({
        title: 'Green Zone Days',
        description: `You've been in the green zone ${metrics.greenDays} out of ${chartData.length} days (${percentage}%).`,
        type: 'info',
      });
    }

    if (metrics.hrvTrend.trend === 'improving') {
      result.push({
        title: 'HRV Improving',
        description: 'Your HRV is trending upward, indicating better parasympathetic function and recovery capacity.',
        type: 'positive',
      });
    }

    return result;
  }, [metrics, timeRange, chartData.length]);

  const showLoading = isLoading || isConnecting || isCheckingConnection;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-red-500" />
            <div>
              <h2 className="text-lg font-semibold">Health Tracker</h2>
              <p className="text-sm text-muted-foreground">WHOOP Recovery & Performance Insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <button
                onClick={() => refetch()}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not Connected State */}
        {!isConnected && !showLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <Link2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Connect WHOOP</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Connect your WHOOP account to view detailed recovery insights, HRV trends, and personalized recommendations.
            </p>
            <button
              onClick={() => connect()}
              disabled={isConnecting}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect WHOOP'}
            </button>
          </div>
        )}

        {/* Loading State */}
        {showLoading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && !showLoading && isConnected && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-muted-foreground mb-4">Failed to load WHOOP data</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        )}

        {/* Connected Content */}
        {isConnected && !showLoading && !error && (
          <>
            {/* Time Range & Tab Selector */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              {/* Tabs */}
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {(['overview', 'recovery', 'hrv', 'data'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Time Range */}
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {([7, 14, 30] as const).map((days) => (
                  <button
                    key={days}
                    onClick={() => setTimeRange(days)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      timeRange === days
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                      icon={Activity}
                      label="Avg Recovery"
                      value={metrics.avgRecovery}
                      unit="%"
                      trend={metrics.recoveryTrend}
                      colorClass={metrics.avgRecovery ? getRecoveryColor(metrics.avgRecovery).text : 'text-muted-foreground'}
                      subtitle={metrics.avgRecovery ? getRecoveryZone(metrics.avgRecovery) : undefined}
                    />
                    <MetricCard
                      icon={Heart}
                      label="Avg HRV"
                      value={metrics.avgHrv}
                      unit="ms"
                      trend={metrics.hrvTrend}
                      colorClass="text-blue-500"
                    />
                    <MetricCard
                      icon={Moon}
                      label="Avg RHR"
                      value={metrics.avgRhr}
                      unit="bpm"
                      trend={metrics.rhrTrend}
                      colorClass="text-purple-500"
                    />
                    <MetricCard
                      icon={Zap}
                      label="Avg Strain"
                      value={metrics.avgStrain}
                      unit=""
                      colorClass="text-orange-500"
                    />
                  </div>

                  {/* Recovery Chart */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">Recovery Trend ({timeRange} days)</h3>
                    {chartData.length > 0 ? (
                      <LineChart data={chartData} metric="recovery" color="#22c55e" yMin={0} yMax={100} unit="%" />
                    ) : (
                      <div className="h-40 flex items-center justify-center text-muted-foreground">No data available</div>
                    )}
                  </div>

                  {/* Insights */}
                  {insights.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Insights</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {insights.map((insight, i) => (
                          <InsightCard key={i} {...insight} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Zone Distribution */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">Recovery Zone Distribution</h3>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-sm">Green (67-100%)</span>
                        </div>
                        <div className="text-2xl font-bold text-green-500">{metrics.greenDays} days</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="text-sm">Yellow (34-66%)</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-500">{metrics.yellowDays} days</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-sm">Red (0-33%)</span>
                        </div>
                        <div className="text-2xl font-bold text-red-500">{metrics.redDays} days</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'recovery' && (
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">Recovery Score ({timeRange} days)</h3>
                    {chartData.length > 0 ? (
                      <LineChart data={chartData} metric="recovery" color="#22c55e" yMin={0} yMax={100} unit="%" height={200} />
                    ) : (
                      <div className="h-40 flex items-center justify-center text-muted-foreground">No data available</div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Average</p>
                      <p className="text-3xl font-bold">{metrics.avgRecovery ?? '—'}%</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Highest</p>
                      <p className="text-3xl font-bold text-green-500">{metrics.maxRecovery ?? '—'}%</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Lowest</p>
                      <p className="text-3xl font-bold text-red-500">{metrics.minRecovery ?? '—'}%</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hrv' && (
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">Heart Rate Variability ({timeRange} days)</h3>
                    {chartData.filter((d) => d.hrv).length > 0 ? (
                      <LineChart
                        data={chartData}
                        metric="hrv"
                        color="#3b82f6"
                        yMin={Math.max(0, (metrics.avgHrv ?? 50) - 40)}
                        yMax={(metrics.avgHrv ?? 50) + 40}
                        unit="ms"
                        height={200}
                      />
                    ) : (
                      <div className="h-40 flex items-center justify-center text-muted-foreground">No HRV data available</div>
                    )}
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">Resting Heart Rate ({timeRange} days)</h3>
                    {chartData.filter((d) => d.rhr).length > 0 ? (
                      <LineChart
                        data={chartData}
                        metric="rhr"
                        color="#a855f7"
                        yMin={Math.max(30, (metrics.avgRhr ?? 60) - 20)}
                        yMax={(metrics.avgRhr ?? 60) + 20}
                        unit="bpm"
                        height={160}
                      />
                    ) : (
                      <div className="h-40 flex items-center justify-center text-muted-foreground">No RHR data available</div>
                    )}
                  </div>

                  <div className="bg-muted/30 border border-border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      About HRV
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Heart Rate Variability (HRV) measures the variation in time between heartbeats. Higher HRV generally
                      indicates better cardiovascular fitness and recovery capacity. Your HRV is personal—focus on your own
                      trends rather than comparing to others.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground border-b border-border">Date</th>
                        <th className="text-center p-3 text-sm font-medium text-muted-foreground border-b border-border">Recovery</th>
                        <th className="text-center p-3 text-sm font-medium text-muted-foreground border-b border-border">HRV</th>
                        <th className="text-center p-3 text-sm font-medium text-muted-foreground border-b border-border">RHR</th>
                        <th className="text-center p-3 text-sm font-medium text-muted-foreground border-b border-border">Strain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...chartData].reverse().map((day) => {
                        const recoveryColor = getRecoveryColor(day.recovery);
                        return (
                          <tr key={day.date} className="hover:bg-muted/30">
                            <td className="p-3 border-b border-border text-sm">{formatDisplayDate(day.date)}</td>
                            <td className="p-3 border-b border-border text-center">
                              <span className={`inline-flex items-center justify-center w-12 h-8 rounded-md font-medium ${recoveryColor.bg} ${recoveryColor.text}`}>
                                {day.recovery}%
                              </span>
                            </td>
                            <td className="p-3 border-b border-border text-center text-sm">
                              {day.hrv !== null ? `${Math.round(day.hrv)} ms` : '—'}
                            </td>
                            <td className="p-3 border-b border-border text-center text-sm">
                              {day.rhr !== null ? `${Math.round(day.rhr)} bpm` : '—'}
                            </td>
                            <td className="p-3 border-b border-border text-center text-sm">
                              {day.strain !== null ? day.strain.toFixed(1) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30 shrink-0">
          <p className="text-xs text-muted-foreground text-center">Data synced from WHOOP • Last updated: {historicalData?.lastUpdated ? new Date(historicalData.lastUpdated).toLocaleString() : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

export default HealthTrackerModal;
