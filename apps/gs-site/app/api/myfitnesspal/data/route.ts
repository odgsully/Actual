import { NextRequest, NextResponse } from 'next/server';
import {
  getFoodDiary,
  getMeasurements,
  getExercises,
  calculateStreak,
  getWeekAverageCalories,
  getLatestWeight,
  getLastNLoggedDays,
  getRollingAverages,
  getWeeklyComparison,
} from '@/lib/myfitnesspal/client';
import type { MFPDataResponse, MFPDataRange, MFPDataType } from '@/lib/myfitnesspal/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/myfitnesspal/data
 *
 * Retrieve cached MFP data for display in the tile modal.
 *
 * Query params:
 * - range: 'today' | 'yesterday' | 'week' | 'month' | 'all' (default: 'week')
 * - type: 'food' | 'weight' | 'exercise' | 'all' (default: 'all')
 */
export async function GET(request: NextRequest): Promise<NextResponse<MFPDataResponse>> {
  try {
    // Note: Connection check removed - data can come from CSV upload
    // which doesn't require cookie authentication

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const range = (searchParams.get('range') || 'week') as MFPDataRange;
    const type = (searchParams.get('type') || 'all') as MFPDataType;

    // Calculate date range
    const today = new Date();
    let startDate = new Date(today);
    const endDate = new Date(today);

    switch (range) {
      case 'today':
        // Just today
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'all':
        startDate.setFullYear(startDate.getFullYear() - 1); // Last year
        break;
    }

    // Fetch requested data types
    const response: MFPDataResponse = {};

    if (type === 'all' || type === 'food') {
      const foodData = await getFoodDiary(startDate, endDate);
      response.food = foodData.map((row) => ({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        calories: row.calories || 0,
        carbs_g: Number(row.carbs_g) || 0,
        fat_g: Number(row.fat_g) || 0,
        protein_g: Number(row.protein_g) || 0,
        fiber_g: row.fiber_g ? Number(row.fiber_g) : undefined,
        sugar_g: row.sugar_g ? Number(row.sugar_g) : undefined,
        sodium_mg: row.sodium_mg ? Number(row.sodium_mg) : undefined,
        calorieGoal: row.calorie_goal || undefined,
        mealsLogged: row.meals_logged || 0,
        syncedAt: row.synced_at,
      }));
    }

    if (type === 'all' || type === 'weight') {
      const weightData = await getMeasurements(startDate, endDate);
      response.weight = weightData.map((row) => ({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        weightLbs: row.weight_lbs ? Number(row.weight_lbs) : undefined,
        weightKg: row.weight_kg ? Number(row.weight_kg) : undefined,
        bodyFatPercent: row.body_fat_percent ? Number(row.body_fat_percent) : undefined,
        syncedAt: row.synced_at,
      }));
    }

    if (type === 'all' || type === 'exercise') {
      const exerciseData = await getExercises(startDate, endDate);
      response.exercise = exerciseData.map((row) => ({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        exerciseName: row.exercise_name,
        durationMinutes: row.duration_minutes || undefined,
        caloriesBurned: row.calories_burned || undefined,
        exerciseType: row.exercise_type as 'Cardio' | 'Strength' | 'Other' | undefined,
        syncedAt: row.synced_at,
      }));
    }

    // Add summary if requesting week or more
    if (range !== 'today' && range !== 'yesterday') {
      const [streak, weekAvg, latestWeight, rollingAvgs, weeklyComp] = await Promise.all([
        calculateStreak(),
        getWeekAverageCalories(),
        getLatestWeight(),
        getRollingAverages(),
        getWeeklyComparison(4), // Last 4 weeks
      ]);

      // Calculate averages from food data
      const foodWithCalories = response.food?.filter((f) => f.calories > 0) || [];
      const avgCalories = foodWithCalories.length
        ? Math.round(
            foodWithCalories.reduce((sum, f) => sum + f.calories, 0) / foodWithCalories.length
          )
        : 0;
      const avgProtein = foodWithCalories.length
        ? Math.round(
            foodWithCalories.reduce((sum, f) => sum + f.protein_g, 0) / foodWithCalories.length
          )
        : 0;
      const avgCarbs = foodWithCalories.length
        ? Math.round(
            foodWithCalories.reduce((sum, f) => sum + f.carbs_g, 0) / foodWithCalories.length
          )
        : 0;
      const avgFat = foodWithCalories.length
        ? Math.round(
            foodWithCalories.reduce((sum, f) => sum + f.fat_g, 0) / foodWithCalories.length
          )
        : 0;

      // Determine weight trend
      const weights = response.weight?.filter((w) => w.weightLbs) || [];
      let weightTrend: 'up' | 'down' | 'stable' = 'stable';
      if (weights.length >= 2) {
        const oldest = weights[weights.length - 1].weightLbs!;
        const newest = weights[0].weightLbs!;
        const diff = newest - oldest;
        if (diff > 1) weightTrend = 'up';
        else if (diff < -1) weightTrend = 'down';
      }

      response.summary = {
        avgCalories,
        avgProtein,
        avgCarbs,
        avgFat,
        daysLogged: foodWithCalories.length,
        longestStreak: streak, // For now, using current streak
        currentStreak: streak,
        weightTrend,
        latestWeight: latestWeight.weightLbs || undefined,
      };

      // Add rolling averages for comparison
      (response as any).rollingAverages = {
        last7Days: rollingAvgs.last7Days,
        last30Days: rollingAvgs.last30Days,
        previous30Days: rollingAvgs.previous30Days,
        weekOverWeekChange: rollingAvgs.weekOverWeekChange,
        monthOverMonthChange: rollingAvgs.monthOverMonthChange,
      };

      // Add weekly comparison data
      (response as any).weeklyComparison = weeklyComp.weeks;
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[MFP Data] Error:', error);

    return NextResponse.json(
      { food: [], weight: [], exercise: [] },
      { status: 500 }
    );
  }
}
