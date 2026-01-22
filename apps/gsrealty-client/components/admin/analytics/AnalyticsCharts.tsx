'use client'

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Color palette for charts (works well with dark glassmorphism)
export const CHART_COLORS = {
  primary: '#60a5fa', // blue-400
  secondary: '#34d399', // emerald-400
  tertiary: '#fbbf24', // amber-400
  quaternary: '#a78bfa', // violet-400
  quinary: '#f87171', // red-400
  grid: 'rgba(255, 255, 255, 0.1)',
  text: 'rgba(255, 255, 255, 0.6)',
}

// Pie chart colors
export const PIE_COLORS = [
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#a78bfa', // violet-400
  '#f87171', // red-400
  '#2dd4bf', // teal-400
]

// Custom tooltip style for dark theme
const CustomTooltip = ({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  valueFormatter?: (value: number) => string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
        <p className="text-white/80 text-sm mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// =============================================================================
// LINE CHART
// =============================================================================

export interface LineChartDataPoint {
  [key: string]: string | number
}

interface LineChartProps {
  data: LineChartDataPoint[]
  lines: Array<{
    dataKey: string
    name: string
    color?: string
  }>
  xAxisKey: string
  height?: number
  valueFormatter?: (value: number) => string
  showGrid?: boolean
  showLegend?: boolean
}

export function AnalyticsLineChart({
  data,
  lines,
  xAxisKey,
  height = 300,
  valueFormatter,
  showGrid = true,
  showLegend = true,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />}
        <XAxis
          dataKey={xAxisKey}
          stroke={CHART_COLORS.text}
          tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
        />
        <YAxis
          stroke={CHART_COLORS.text}
          tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
          tickFormatter={valueFormatter}
        />
        <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: CHART_COLORS.text }}
            formatter={(value) => <span className="text-white/80 text-sm">{value}</span>}
          />
        )}
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color || Object.values(CHART_COLORS)[index % 5]}
            strokeWidth={2}
            dot={{ fill: line.color || Object.values(CHART_COLORS)[index % 5], strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// =============================================================================
// AREA CHART
// =============================================================================

interface AreaChartProps {
  data: LineChartDataPoint[]
  areas: Array<{
    dataKey: string
    name: string
    color?: string
    fillOpacity?: number
  }>
  xAxisKey: string
  height?: number
  valueFormatter?: (value: number) => string
  showGrid?: boolean
  showLegend?: boolean
  stacked?: boolean
}

export function AnalyticsAreaChart({
  data,
  areas,
  xAxisKey,
  height = 300,
  valueFormatter,
  showGrid = true,
  showLegend = true,
  stacked = false,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />}
        <XAxis
          dataKey={xAxisKey}
          stroke={CHART_COLORS.text}
          tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
        />
        <YAxis
          stroke={CHART_COLORS.text}
          tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
          tickFormatter={valueFormatter}
        />
        <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
        {showLegend && (
          <Legend
            formatter={(value) => <span className="text-white/80 text-sm">{value}</span>}
          />
        )}
        {areas.map((area, index) => {
          const color = area.color || Object.values(CHART_COLORS)[index % 5]
          return (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name}
              stroke={color}
              fill={color}
              fillOpacity={area.fillOpacity ?? 0.3}
              stackId={stacked ? 'stack' : undefined}
            />
          )
        })}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// =============================================================================
// BAR CHART
// =============================================================================

interface BarChartProps {
  data: LineChartDataPoint[]
  bars: Array<{
    dataKey: string
    name: string
    color?: string
  }>
  xAxisKey: string
  height?: number
  valueFormatter?: (value: number) => string
  showGrid?: boolean
  showLegend?: boolean
  horizontal?: boolean
  stacked?: boolean
}

export function AnalyticsBarChart({
  data,
  bars,
  xAxisKey,
  height = 300,
  valueFormatter,
  showGrid = true,
  showLegend = true,
  horizontal = false,
  stacked = false,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />}
        {horizontal ? (
          <>
            <XAxis
              type="number"
              stroke={CHART_COLORS.text}
              tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
              tickFormatter={valueFormatter}
            />
            <YAxis
              dataKey={xAxisKey}
              type="category"
              stroke={CHART_COLORS.text}
              tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
              width={100}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              stroke={CHART_COLORS.text}
              tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
            />
            <YAxis
              stroke={CHART_COLORS.text}
              tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
              tickFormatter={valueFormatter}
            />
          </>
        )}
        <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
        {showLegend && (
          <Legend
            formatter={(value) => <span className="text-white/80 text-sm">{value}</span>}
          />
        )}
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color || Object.values(CHART_COLORS)[index % 5]}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// =============================================================================
// PIE / DONUT CHART
// =============================================================================

interface PieChartDataPoint {
  name: string
  value: number
}

interface PieChartProps {
  data: PieChartDataPoint[]
  height?: number
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  innerRadius?: number // Set > 0 for donut chart
  outerRadius?: number
  showLabels?: boolean
}

export function AnalyticsPieChart({
  data,
  height = 300,
  valueFormatter,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
  showLabels = false,
}: PieChartProps) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0)

  const renderLabel = ({ name, value, percent }: { name: string; value: number; percent: number }) => {
    if (!showLabels) return null
    return `${name}: ${Math.round(percent * 100)}%`
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          label={showLabels ? renderLabel : undefined}
          labelLine={showLabels}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const entry = payload[0]
              const percentage = total > 0 ? Math.round(((entry.value as number) / total) * 100) : 0
              return (
                <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
                  <p className="text-white text-sm font-medium">{entry.name}</p>
                  <p className="text-white/80 text-sm">
                    {valueFormatter
                      ? valueFormatter(entry.value as number)
                      : entry.value}{' '}
                    ({percentage}%)
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        {showLegend && (
          <Legend
            formatter={(value, entry) => {
              const item = data.find((d) => d.name === value)
              const percentage = total > 0 && item ? Math.round((item.value / total) * 100) : 0
              return (
                <span className="text-white/80 text-sm">
                  {value} ({percentage}%)
                </span>
              )
            }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}

// =============================================================================
// DONUT CHART (convenience wrapper)
// =============================================================================

interface DonutChartProps extends Omit<PieChartProps, 'innerRadius'> {
  centerLabel?: string
  centerValue?: string
}

export function AnalyticsDonutChart({
  data,
  height = 300,
  centerLabel,
  centerValue,
  ...props
}: DonutChartProps) {
  return (
    <div className="relative">
      <AnalyticsPieChart
        data={data}
        height={height}
        innerRadius={60}
        outerRadius={80}
        {...props}
      />
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && <span className="text-2xl font-bold text-white">{centerValue}</span>}
          {centerLabel && <span className="text-sm text-white/60">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}
