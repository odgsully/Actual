import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  parseNutritionCSV,
  transformNutritionToFoodDiary,
  parseProgressCSV,
  transformProgressToMeasurements,
  parseExerciseCSV,
  transformExerciseToRows,
} from '@/lib/myfitnesspal/parser';
import { storeFoodDiary, storeMeasurements, storeExercises, updateSyncStatus } from '@/lib/myfitnesspal/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/myfitnesspal/upload
 *
 * Upload MFP export CSV file(s) manually.
 * User exports from https://www.myfitnesspal.com/reports/export
 * and uploads the CSV files here.
 *
 * Accepts:
 * - nutrition: Nutrition Summary CSV content
 * - progress: Progress CSV content (optional)
 * - exercise: Exercise CSV content (optional)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { nutrition, progress, exercise } = body as {
      nutrition?: string;
      progress?: string;
      exercise?: string;
    };

    if (!nutrition && !progress && !exercise) {
      return NextResponse.json(
        { success: false, error: 'At least one CSV content is required' },
        { status: 400 }
      );
    }

    let foodEntries = 0;
    let weightEntries = 0;
    let exerciseEntries = 0;

    // Process nutrition CSV
    if (nutrition) {
      console.log('[MFP Upload] Processing nutrition CSV...');
      const nutritionRows = parseNutritionCSV(nutrition);
      console.log(`[MFP Upload] Parsed ${nutritionRows.length} nutrition rows`);

      if (nutritionRows.length > 0) {
        const foodDiaryRows = transformNutritionToFoodDiary(nutritionRows);
        console.log(`[MFP Upload] Transformed to ${foodDiaryRows.length} daily entries`);

        foodEntries = await storeFoodDiary(foodDiaryRows);
        console.log(`[MFP Upload] Stored ${foodEntries} food diary entries`);
      }
    }

    // Process progress CSV
    if (progress) {
      console.log('[MFP Upload] Processing progress CSV...');
      const progressRows = parseProgressCSV(progress);
      console.log(`[MFP Upload] Parsed ${progressRows.length} progress rows`);

      if (progressRows.length > 0) {
        const measurementRows = transformProgressToMeasurements(progressRows);
        console.log(`[MFP Upload] Transformed to ${measurementRows.length} measurement entries`);

        weightEntries = await storeMeasurements(measurementRows);
        console.log(`[MFP Upload] Stored ${weightEntries} measurement entries`);
      }
    }

    // Process exercise CSV
    if (exercise) {
      console.log('[MFP Upload] Processing exercise CSV...');
      const exerciseRows = parseExerciseCSV(exercise);
      console.log(`[MFP Upload] Parsed ${exerciseRows.length} exercise rows`);

      if (exerciseRows.length > 0) {
        const exerciseDbRows = transformExerciseToRows(exerciseRows);
        console.log(`[MFP Upload] Transformed to ${exerciseDbRows.length} exercise entries`);

        exerciseEntries = await storeExercises(exerciseDbRows);
        console.log(`[MFP Upload] Stored ${exerciseEntries} exercise entries`);
      }
    }

    // Update sync status
    await updateSyncStatus({
      last_sync_at: new Date().toISOString(),
      last_sync_status: 'success',
      last_sync_error: null,
    });

    return NextResponse.json({
      success: true,
      imported: {
        food: foodEntries,
        weight: weightEntries,
        exercise: exerciseEntries,
      },
    });
  } catch (error) {
    console.error('[MFP Upload] Error:', error);

    await updateSyncStatus({
      last_sync_at: new Date().toISOString(),
      last_sync_status: 'failed',
      last_sync_error: error instanceof Error ? error.message : 'Upload failed',
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}
