/**
 * OpenAI Vision Prompt for Screen Time Screenshot Extraction
 */

export const SCREEN_TIME_EXTRACTION_PROMPT = `You are analyzing an Apple Screen Time screenshot. Extract the following data and return it as valid JSON.

IMPORTANT RULES:
1. Convert ALL time durations to total minutes (e.g., "9h 57m" = 597 minutes, "24h 47m" = 1487 minutes)
2. If a field is not visible in the screenshot, set it to null
3. For percentages, extract just the number (e.g., "+16%" = 16, "-5%" = -5)
4. Return ONLY valid JSON with no markdown formatting

REQUIRED JSON STRUCTURE:
{
  "period": "week" or "day",
  "dailyAverageMinutes": number or null,
  "weekOverWeekChangePercent": number or null,
  "categories": {
    "CategoryName": minutes_as_number,
    ...
  } or null,
  "topApps": [
    { "name": "AppName", "minutes": number },
    ...
  ] or null,
  "pickups": {
    "dailyAverage": number or null,
    "weekOverWeekChangePercent": number or null
  } or null,
  "notifications": {
    "dailyAverage": number or null,
    "weekOverWeekChangePercent": number or null
  } or null,
  "firstAppsAfterPickup": ["App1", "App2", ...] or null
}

CATEGORY MAPPING (use these exact names when possible):
- "Entertainment" for media, streaming, games
- "Social" for social media apps
- "Productivity" for work/office apps
- "Utilities" for system tools, settings
- "Information & Reading" for news, books
- "Creativity" for creative apps
- "Health & Fitness" for health apps
- "Education" for learning apps
- "Other" for anything else

EXAMPLES:
- "Daily Average: 9h 57m" → dailyAverageMinutes: 597
- "16% from last week" → weekOverWeekChangePercent: 16
- "158 pickups" → pickups.dailyAverage: 158
- "Entertainment: 18h 44m" → categories.Entertainment: 1124

Now analyze the screenshot and extract the data:`;

/**
 * Build the OpenAI API message array for vision request
 */
export function buildVisionMessages(imageBase64: string, mimeType: string = 'image/png') {
  return [
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: SCREEN_TIME_EXTRACTION_PROMPT,
        },
        {
          type: 'image_url' as const,
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
            detail: 'high' as const,
          },
        },
      ],
    },
  ];
}

/**
 * Parse the LLM response JSON, handling potential formatting issues
 */
export function parseExtractionResponse(response: string): Record<string, unknown> | null {
  try {
    // Try direct parse first
    return JSON.parse(response);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // Fall through to next attempt
      }
    }

    // Try to find JSON object in response
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // Give up
      }
    }

    console.error('Failed to parse LLM response:', response);
    return null;
  }
}

/**
 * Merge multiple extraction results into a single weekly summary
 * Takes the best/most complete data from each extraction
 */
export function mergeExtractions(
  extractions: Array<Record<string, unknown>>
): Record<string, unknown> {
  if (extractions.length === 0) {
    return {};
  }

  if (extractions.length === 1) {
    return extractions[0];
  }

  // Priority: prefer week data over day data, and more complete data
  const merged: Record<string, unknown> = {
    period: 'week',
    dailyAverageMinutes: null,
    weekOverWeekChangePercent: null,
    categories: null,
    topApps: null,
    pickups: null,
    notifications: null,
    firstAppsAfterPickup: null,
  };

  for (const extraction of extractions) {
    // Prefer week period data
    if (extraction.period === 'week' || merged.period !== 'week') {
      // Take non-null values
      if (extraction.dailyAverageMinutes != null && merged.dailyAverageMinutes == null) {
        merged.dailyAverageMinutes = extraction.dailyAverageMinutes;
      }
      if (extraction.weekOverWeekChangePercent != null && merged.weekOverWeekChangePercent == null) {
        merged.weekOverWeekChangePercent = extraction.weekOverWeekChangePercent;
      }

      // Merge categories (combine all unique categories)
      if (extraction.categories && typeof extraction.categories === 'object') {
        merged.categories = {
          ...(merged.categories as Record<string, number> || {}),
          ...(extraction.categories as Record<string, number>),
        };
      }

      // Take the longest topApps list
      if (Array.isArray(extraction.topApps)) {
        const currentLength = Array.isArray(merged.topApps) ? merged.topApps.length : 0;
        if (extraction.topApps.length > currentLength) {
          merged.topApps = extraction.topApps;
        }
      }

      // Take pickups data if available
      if (extraction.pickups && merged.pickups == null) {
        merged.pickups = extraction.pickups;
      }

      // Take notifications data if available
      if (extraction.notifications && merged.notifications == null) {
        merged.notifications = extraction.notifications;
      }

      // Merge firstAppsAfterPickup
      if (Array.isArray(extraction.firstAppsAfterPickup)) {
        const existing = merged.firstAppsAfterPickup as string[] || [];
        const newApps = extraction.firstAppsAfterPickup as string[];
        merged.firstAppsAfterPickup = [...new Set([...existing, ...newApps])];
      }
    }
  }

  return merged;
}
