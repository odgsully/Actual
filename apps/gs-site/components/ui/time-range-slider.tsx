'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { formatTime, toMinutes, fromMinutes } from '@/hooks/useLIFXScheduleConfig';

interface TimeRangeSliderProps {
  /** Start hour (0-23) */
  startHour: number;
  /** Start minute (0-59) */
  startMinute: number;
  /** End hour (0-23) */
  endHour: number;
  /** End minute (0-59) */
  endMinute: number;
  /** Minimum hour allowed */
  minHour?: number;
  /** Maximum hour allowed */
  maxHour?: number;
  /** Step in minutes */
  step?: number;
  /** Called when start time changes */
  onStartChange: (hour: number, minute: number) => void;
  /** Called when end time changes */
  onEndChange: (hour: number, minute: number) => void;
  /** Label for the slider */
  label?: string;
  /** Icon to show */
  icon?: React.ReactNode;
  /** Color theme */
  theme?: 'amber' | 'indigo' | 'purple';
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Dual-thumb time range slider for selecting start and end times
 */
export function TimeRangeSlider({
  startHour,
  startMinute,
  endHour,
  endMinute,
  minHour = 0,
  maxHour = 24,
  step = 15,
  onStartChange,
  onEndChange,
  label,
  icon,
  theme = 'amber',
  disabled = false,
}: TimeRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  // Convert to minutes for easier calculations
  const minValue = minHour * 60;
  const maxValue = maxHour * 60;
  const startValue = toMinutes(startHour, startMinute);
  const endValue = toMinutes(endHour, endMinute);

  // Calculate percentages for positioning
  const range = maxValue - minValue;
  const startPercent = ((startValue - minValue) / range) * 100;
  const endPercent = ((endValue - minValue) / range) * 100;

  // Theme colors
  const themeColors = {
    amber: {
      track: 'bg-amber-500/30',
      fill: 'bg-amber-500',
      thumb: 'bg-amber-500 border-amber-400',
      thumbHover: 'hover:bg-amber-400',
      text: 'text-amber-500',
    },
    indigo: {
      track: 'bg-indigo-500/30',
      fill: 'bg-indigo-500',
      thumb: 'bg-indigo-500 border-indigo-400',
      thumbHover: 'hover:bg-indigo-400',
      text: 'text-indigo-400',
    },
    purple: {
      track: 'bg-purple-500/30',
      fill: 'bg-purple-500',
      thumb: 'bg-purple-500 border-purple-400',
      thumbHover: 'hover:bg-purple-400',
      text: 'text-purple-400',
    },
  };

  const colors = themeColors[theme];

  // Convert position to time value
  const positionToValue = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return minValue;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = minValue + percent * range;
      // Snap to step
      return Math.round(rawValue / step) * step;
    },
    [minValue, range, step]
  );

  // Handle mouse/touch move
  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || disabled) return;

      const value = positionToValue(clientX);
      const { hour, minute } = fromMinutes(value);

      if (isDragging === 'start') {
        // Don't let start exceed end - 1 step
        if (value < endValue - step) {
          onStartChange(hour, minute);
        }
      } else {
        // Don't let end go below start + 1 step
        if (value > startValue + step) {
          onEndChange(hour, minute);
        }
      }
    },
    [isDragging, disabled, positionToValue, endValue, startValue, step, onStartChange, onEndChange]
  );

  // Mouse event handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMove]);

  // Touch event handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(null);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove]);

  // Generate time labels
  const timeLabels = [];
  for (let h = minHour; h <= maxHour; h += 2) {
    const percent = ((h * 60 - minValue) / range) * 100;
    timeLabels.push({ hour: h, percent });
  }

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-50' : ''}`}>
      {/* Header */}
      {(label || icon) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          </div>
          <div className={`text-sm ${colors.text}`}>
            {formatTime(startHour, startMinute)} → {formatTime(endHour, endMinute)}
          </div>
        </div>
      )}

      {/* Slider track */}
      <div className="relative pt-2 pb-6">
        {/* Background track */}
        <div
          ref={trackRef}
          className={`relative h-2 rounded-full ${colors.track}`}
        >
          {/* Filled range */}
          <div
            className={`absolute h-full rounded-full ${colors.fill}`}
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
            }}
          />

          {/* Start thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 shadow-lg transition-transform ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:scale-110'} ${colors.thumb} ${!disabled && colors.thumbHover}`}
            style={{ left: `${startPercent}%` }}
            onMouseDown={(e) => {
              if (disabled) return;
              e.preventDefault();
              setIsDragging('start');
            }}
            onTouchStart={() => !disabled && setIsDragging('start')}
            role="slider"
            aria-label="Start time"
            aria-valuenow={startValue}
            aria-valuemin={minValue}
            aria-valuemax={endValue - step}
            tabIndex={0}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(startHour, startMinute)}
            </div>
          </div>

          {/* End thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 shadow-lg transition-transform ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:scale-110'} ${colors.thumb} ${!disabled && colors.thumbHover}`}
            style={{ left: `${endPercent}%` }}
            onMouseDown={(e) => {
              if (disabled) return;
              e.preventDefault();
              setIsDragging('end');
            }}
            onTouchStart={() => !disabled && setIsDragging('end')}
            role="slider"
            aria-label="End time"
            aria-valuenow={endValue}
            aria-valuemin={startValue + step}
            aria-valuemax={maxValue}
            tabIndex={0}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(endHour, endMinute)}
            </div>
          </div>
        </div>

        {/* Time labels */}
        <div className="relative mt-2">
          {timeLabels.map(({ hour, percent }) => (
            <div
              key={hour}
              className="absolute -translate-x-1/2 text-xs text-muted-foreground"
              style={{ left: `${percent}%` }}
            >
              {hour % 12 || 12}{hour >= 12 ? 'p' : 'a'}
            </div>
          ))}
        </div>
      </div>

      {/* Manual time inputs */}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Start:</label>
          <input
            type="time"
            value={`${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`}
            onChange={(e) => {
              if (disabled) return;
              const [h, m] = e.target.value.split(':').map(Number);
              if (!isNaN(h) && !isNaN(m)) {
                // Validate within bounds and before end
                const newMinutes = h * 60 + m;
                if (newMinutes >= minValue && newMinutes < endValue - step) {
                  onStartChange(h, m);
                }
              }
            }}
            disabled={disabled}
            className={`px-2 py-1 text-sm rounded border bg-background ${colors.text} border-border focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50`}
          />
        </div>
        <span className="text-muted-foreground">→</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">End:</label>
          <input
            type="time"
            value={`${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`}
            onChange={(e) => {
              if (disabled) return;
              const [h, m] = e.target.value.split(':').map(Number);
              if (!isNaN(h) && !isNaN(m)) {
                // Validate within bounds and after start
                const newMinutes = h * 60 + m;
                if (newMinutes <= maxValue && newMinutes > startValue + step) {
                  onEndChange(h, m);
                }
              }
            }}
            disabled={disabled}
            className={`px-2 py-1 text-sm rounded border bg-background ${colors.text} border-border focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50`}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground">
        Form fades in from <span className={colors.text}>{formatTime(startHour, startMinute)}</span> (0% visible)
        to <span className={colors.text}>{formatTime(endHour, endMinute)}</span> (100% visible)
      </p>
    </div>
  );
}

export default TimeRangeSlider;
