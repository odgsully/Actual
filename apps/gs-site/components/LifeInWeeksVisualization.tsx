'use client';

import { useMemo } from 'react';

// ============================================================
// Hardcoded User Configuration
// ============================================================

export const GS_BIRTH_DATE = new Date('1999-02-11');
export const GS_TARGET_LIFESPAN = 50; // Target age: 50 (year 2049)

// ============================================================
// Utility Functions
// ============================================================

function calculateWeeksLived(birthDate: Date): number {
  const today = new Date();
  const diff = today.getTime() - birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

// ============================================================
// Types
// ============================================================

interface LifeInWeeksVisualizationProps {
  birthDate?: Date;
  expectedLifespan?: number;
  className?: string;
}

// ============================================================
// Main Component
// ============================================================

/**
 * LifeInWeeksVisualization - Memento Mori life calendar
 *
 * Renders a grid where each box represents one week of life.
 * Filled boxes = weeks lived, empty boxes = weeks remaining.
 * "MEMENTO MORI" divides the grid at the halfway point.
 */
export function LifeInWeeksVisualization({
  birthDate = GS_BIRTH_DATE,
  expectedLifespan = GS_TARGET_LIFESPAN,
  className = '',
}: LifeInWeeksVisualizationProps) {
  const weeksLived = calculateWeeksLived(birthDate);
  const totalWeeks = expectedLifespan * 52;
  const weeksPerYear = 52;

  // Calculate end year
  const endYear = birthDate.getFullYear() + expectedLifespan;

  // Halfway point for the MEMENTO MORI divider
  const halfwayYear = Math.floor(expectedLifespan / 2);

  // Format birth date
  const birthMonth = birthDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const birthDay = birthDate.getDate();

  // Generate weeks array - each row is a year, each column is a week
  const weeksGrid = useMemo(() => {
    const grid: boolean[][] = [];
    let weekCount = 0;

    for (let year = 0; year < expectedLifespan; year++) {
      const row: boolean[] = [];
      for (let week = 0; week < weeksPerYear; week++) {
        row.push(weekCount < weeksLived);
        weekCount++;
      }
      grid.push(row);
    }
    return grid;
  }, [weeksLived, expectedLifespan]);

  // Group weeks into 4-week blocks (months roughly)
  const blocksPerRow = 13; // 52 weeks / 4 = 13 blocks per year

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Header - Birth date top left aligned with grid */}
      <div className="w-full flex justify-start mb-3">
        <span className="font-mono text-sm font-bold tracking-widest text-black">
          {birthMonth} {birthDay}
        </span>
      </div>

      {/* Weeks Grid - First half (years 0 to halfway-1) */}
      <div className="flex flex-col gap-[2px] items-center">
        {weeksGrid.slice(0, halfwayYear).map((yearWeeks, yearIndex) => (
          <div key={yearIndex} className="flex gap-[3px] justify-center">
            {Array.from({ length: blocksPerRow }, (_, blockIndex) => {
              const startWeek = blockIndex * 4;
              const blockWeeks = yearWeeks.slice(startWeek, startWeek + 4);
              return (
                <div key={blockIndex} className="flex gap-[1px]">
                  {blockWeeks.map((isLived, weekInBlock) => (
                    <div
                      key={weekInBlock}
                      className={`w-[5px] h-[5px] md:w-[6px] md:h-[6px] ${
                        isLived ? 'bg-black' : 'border border-black bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* MEMENTO MORI text - centered at halfway mark */}
      <div className="py-8 md:py-10 text-center w-full">
        <h1
          className="text-3xl md:text-5xl font-bold tracking-[0.25em] md:tracking-[0.3em] text-black uppercase"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          MEMENTO MORI
        </h1>
      </div>

      {/* Weeks Grid - Second half (years halfway to end) */}
      <div className="flex flex-col gap-[2px] items-center">
        {weeksGrid.slice(halfwayYear).map((yearWeeks, yearIndex) => (
          <div key={yearIndex + halfwayYear} className="flex gap-[3px] justify-center">
            {Array.from({ length: blocksPerRow }, (_, blockIndex) => {
              const startWeek = blockIndex * 4;
              const blockWeeks = yearWeeks.slice(startWeek, startWeek + 4);
              return (
                <div key={blockIndex} className="flex gap-[1px]">
                  {blockWeeks.map((isLived, weekInBlock) => (
                    <div
                      key={weekInBlock}
                      className={`w-[5px] h-[5px] md:w-[6px] md:h-[6px] ${
                        isLived ? 'bg-black' : 'border border-black bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer - End year bottom right aligned with grid */}
      <div className="w-full flex justify-end mt-3">
        <span className="font-mono text-sm font-bold tracking-widest text-black">
          {endYear}
        </span>
      </div>

      {/* Stats footer */}
      <div className="w-full mt-6 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
        <span>{weeksLived.toLocaleString()} weeks lived</span>
        <span>{(totalWeeks - weeksLived).toLocaleString()} weeks remaining</span>
      </div>
    </div>
  );
}

export default LifeInWeeksVisualization;
