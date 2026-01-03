/**
 * MyFitnessPal Export Parser
 *
 * Parses the CSV export files from MyFitnessPal Premium.
 * The export produces a ZIP with 3 CSV files:
 * - Nutrition Summary.csv
 * - Progress.csv
 * - Exercise.csv
 */

import type {
  MFPExportData,
  MFPExportNutritionRow,
  MFPExportProgressRow,
  MFPExportExerciseRow,
  MFPFoodDiaryRow,
  MFPMeasurementRow,
  MFPExerciseRow,
} from './types';

/**
 * Parse a CSV string into an array of objects
 */
function parseCSV<T extends Record<string, string>>(csvText: string): T[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const data: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    data.push(row as T);
  }

  return data;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse numeric value from string, handling commas and empty values
 */
function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const cleaned = value.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Get value from row by trying multiple possible column names
 */
function getColumnValue(
  row: Record<string, string>,
  possibleNames: string[]
): string | undefined {
  for (const name of possibleNames) {
    // Try exact match
    if (row[name] !== undefined) return row[name];
    // Try case-insensitive match
    const lowerName = name.toLowerCase();
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === lowerName) return row[key];
      // Try partial match (e.g., "Carbohydrates" matches "Carbohydrates (g)")
      if (key.toLowerCase().includes(lowerName)) return row[key];
    }
  }
  return undefined;
}

/**
 * Parse MFP export ZIP file
 *
 * Note: This is a simplified implementation. For full ZIP support,
 * you may need to install 'jszip' package:
 * npm install jszip @types/jszip
 */
export async function parseMFPExport(zipBuffer: ArrayBuffer): Promise<MFPExportData> {
  // For now, we'll throw an error indicating jszip needs to be installed
  // In production, you would use jszip to extract the files

  // Placeholder - in a real implementation:
  // 1. Use jszip to extract files from the ZIP
  // 2. Parse each CSV file
  // 3. Return combined data

  console.warn(
    '[MFP Parser] ZIP parsing not yet implemented. Install jszip for full support.'
  );

  // Return empty data for now
  return {
    nutrition: [],
    progress: [],
    exercise: [],
  };
}

/**
 * Parse Nutrition Summary CSV content
 */
export function parseNutritionCSV(csvContent: string): MFPExportNutritionRow[] {
  return parseCSV(csvContent) as unknown as MFPExportNutritionRow[];
}

/**
 * Parse Progress CSV content
 */
export function parseProgressCSV(csvContent: string): MFPExportProgressRow[] {
  return parseCSV(csvContent) as unknown as MFPExportProgressRow[];
}

/**
 * Parse Exercise CSV content
 */
export function parseExerciseCSV(csvContent: string): MFPExportExerciseRow[] {
  return parseCSV(csvContent) as unknown as MFPExportExerciseRow[];
}

/**
 * Transform nutrition export rows into food diary rows for database storage
 *
 * MFP exports have one row per meal, so we need to aggregate by date
 */
export function transformNutritionToFoodDiary(
  nutritionRows: MFPExportNutritionRow[]
): Partial<MFPFoodDiaryRow>[] {
  // Group by date
  const byDate = new Map<
    string,
    {
      calories: number;
      carbs: number;
      fat: number;
      protein: number;
      fiber: number;
      sugar: number;
      sodium: number;
      mealsLogged: number;
    }
  >();

  // Log first row columns for debugging
  if (nutritionRows.length > 0) {
    const firstRow = nutritionRows[0] as unknown as Record<string, string>;
    console.log('[MFP Parser] CSV columns:', Object.keys(firstRow));
    console.log('[MFP Parser] First row sample:', firstRow);
  }

  for (const row of nutritionRows) {
    // Cast to generic record for flexible column access
    const rowData = row as unknown as Record<string, string>;

    const date = getColumnValue(rowData, ['Date', 'date']);
    if (!date) continue;

    // Parse MFP date format (may vary)
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) continue;

    const existing = byDate.get(normalizedDate) || {
      calories: 0,
      carbs: 0,
      fat: 0,
      protein: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      mealsLogged: 0,
    };

    // Use flexible column matching for all nutrients
    const calories = parseNumber(getColumnValue(rowData, ['Calories', 'calories', 'Cal'])) || 0;
    const carbs = parseNumber(getColumnValue(rowData, ['Carbohydrates', 'carbohydrates', 'Carbs', 'carbs', 'Total Carbohydrates'])) || 0;
    const fat = parseNumber(getColumnValue(rowData, ['Fat', 'fat', 'Total Fat'])) || 0;
    const protein = parseNumber(getColumnValue(rowData, ['Protein', 'protein'])) || 0;
    const fiber = parseNumber(getColumnValue(rowData, ['Fiber', 'fiber', 'Dietary Fiber'])) || 0;
    const sugar = parseNumber(getColumnValue(rowData, ['Sugar', 'sugar', 'Sugars'])) || 0;
    const sodium = parseNumber(getColumnValue(rowData, ['Sodium', 'sodium'])) || 0;

    existing.calories += calories;
    existing.carbs += carbs;
    existing.fat += fat;
    existing.protein += protein;
    existing.fiber += fiber;
    existing.sugar += sugar;
    existing.sodium += sodium;

    // Count as a meal if it has calories
    if (calories > 0) {
      existing.mealsLogged++;
    }

    byDate.set(normalizedDate, existing);
  }

  // Transform to database rows
  const result: Partial<MFPFoodDiaryRow>[] = [];
  for (const [date, data] of byDate) {
    result.push({
      date,
      calories: Math.round(data.calories),
      carbs_g: data.carbs,
      fat_g: data.fat,
      protein_g: data.protein,
      fiber_g: data.fiber,
      sugar_g: data.sugar,
      sodium_mg: data.sodium,
      meals_logged: data.mealsLogged,
    });
  }

  return result;
}

/**
 * Transform progress export rows into measurement rows for database storage
 */
export function transformProgressToMeasurements(
  progressRows: MFPExportProgressRow[]
): Partial<MFPMeasurementRow>[] {
  const result: Partial<MFPMeasurementRow>[] = [];

  for (const row of progressRows) {
    const date = row.Date;
    if (!date) continue;

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) continue;

    const weightLbs = parseNumber(row.Weight);
    if (!weightLbs) continue; // Skip rows without weight

    result.push({
      date: normalizedDate,
      weight_lbs: weightLbs,
      weight_kg: weightLbs ? weightLbs * 0.453592 : null,
      body_fat_percent: parseNumber(row['Body Fat %']),
      neck_cm: parseNumber(row.Neck),
      waist_cm: parseNumber(row.Waist),
      hips_cm: parseNumber(row.Hips),
    });
  }

  return result;
}

/**
 * Transform exercise export rows into exercise rows for database storage
 */
export function transformExerciseToRows(
  exerciseRows: MFPExportExerciseRow[]
): Partial<MFPExerciseRow>[] {
  const result: Partial<MFPExerciseRow>[] = [];

  for (const row of exerciseRows) {
    const date = row.Date;
    if (!date) continue;

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) continue;

    const exerciseName = row['Exercise Name'];
    if (!exerciseName) continue;

    result.push({
      date: normalizedDate,
      exercise_name: exerciseName,
      duration_minutes: parseNumber(row['Exercise Minutes']) as number | null,
      calories_burned: parseNumber(row['Exercise Calories Burned']) as number | null,
    });
  }

  return result;
}

/**
 * Normalize various date formats to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Try various common formats
  const formats = [
    // YYYY-MM-DD
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD/MM/YYYY (European)
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  ];

  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 10);
  }

  // Try MM/DD/YYYY (US format - MFP default)
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try parsing with Date constructor as fallback
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

/**
 * Parse raw HTML diary page to extract nutrition data
 *
 * Fallback method when CSV export is not available
 */
export function parseDiaryHTML(html: string): {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  mealsLogged: number;
} {
  const result = {
    calories: 0,
    carbs: 0,
    fat: 0,
    protein: 0,
    mealsLogged: 0,
  };

  // Look for the totals row
  // MFP diary pages have a table with class "total" for the totals row
  const totalRowMatch = html.match(/class="total"[^>]*>[\s\S]*?<\/tr>/i);
  if (totalRowMatch) {
    const totalRow = totalRowMatch[0];

    // Extract numbers from cells
    const cellMatches = totalRow.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
    const values: number[] = [];

    for (const cell of cellMatches) {
      // Extract numeric content
      const numMatch = cell.match(/>[\s]*(-?\d[\d,]*)/);
      if (numMatch) {
        values.push(parseInt(numMatch[1].replace(/,/g, ''), 10));
      }
    }

    // MFP order is typically: Calories, Carbs, Fat, Protein, ...
    if (values.length >= 1) result.calories = values[0];
    if (values.length >= 2) result.carbs = values[1];
    if (values.length >= 3) result.fat = values[2];
    if (values.length >= 4) result.protein = values[3];
  }

  // Count logged meals
  const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  for (const meal of meals) {
    // Look for meal sections with actual food entries
    const mealSection = html.match(
      new RegExp(`id="diary-group-[^"]*"[^>]*>\\s*${meal}[\\s\\S]*?(?=id="diary-group-|$)`, 'i')
    );
    if (mealSection && mealSection[0].includes('class="bottom"')) {
      result.mealsLogged++;
    }
  }

  return result;
}

/**
 * Validate and sanitize parsed data
 */
export function validateFoodDiaryRow(
  row: Partial<MFPFoodDiaryRow>
): Partial<MFPFoodDiaryRow> | null {
  if (!row.date) return null;

  // Reasonable bounds for daily values
  const maxCalories = 20000;
  const maxMacro = 2000; // grams

  return {
    ...row,
    calories: row.calories && row.calories > 0 && row.calories < maxCalories ? row.calories : null,
    carbs_g: row.carbs_g && row.carbs_g >= 0 && row.carbs_g < maxMacro ? row.carbs_g : null,
    fat_g: row.fat_g && row.fat_g >= 0 && row.fat_g < maxMacro ? row.fat_g : null,
    protein_g: row.protein_g && row.protein_g >= 0 && row.protein_g < maxMacro ? row.protein_g : null,
    fiber_g: row.fiber_g && row.fiber_g >= 0 && row.fiber_g < maxMacro ? row.fiber_g : null,
    sugar_g: row.sugar_g && row.sugar_g >= 0 && row.sugar_g < maxMacro ? row.sugar_g : null,
    sodium_mg:
      row.sodium_mg && row.sodium_mg >= 0 && row.sodium_mg < 100000 ? row.sodium_mg : null,
    meals_logged: row.meals_logged && row.meals_logged >= 0 && row.meals_logged <= 10 ? row.meals_logged : 0,
  };
}

/**
 * Validate and sanitize measurement data
 */
export function validateMeasurementRow(
  row: Partial<MFPMeasurementRow>
): Partial<MFPMeasurementRow> | null {
  if (!row.date) return null;

  // Reasonable bounds
  const minWeight = 50; // lbs
  const maxWeight = 1000; // lbs

  const weightLbs = row.weight_lbs;
  if (weightLbs && (weightLbs < minWeight || weightLbs > maxWeight)) {
    return null;
  }

  return {
    ...row,
    weight_lbs: weightLbs,
    weight_kg: weightLbs ? weightLbs * 0.453592 : null,
    body_fat_percent:
      row.body_fat_percent && row.body_fat_percent > 0 && row.body_fat_percent < 100
        ? row.body_fat_percent
        : null,
  };
}
