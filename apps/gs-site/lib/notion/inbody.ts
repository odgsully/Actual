/**
 * Notion InBody Database Client
 *
 * Creates and manages InBody scan entries in Notion.
 * Syncs with local Supabase storage for dual-write.
 *
 * Database Schema (create in Notion):
 * - Scan Date: Date (required)
 * - Weight (kg): Number
 * - Body Fat %: Number
 * - Muscle Mass (kg): Number
 * - BMI: Number
 * - BMR: Number
 * - InBody Score: Number
 * - Visceral Fat: Number
 * - Location: Text
 * - Notes: Rich Text
 */

const NOTION_API_VERSION = '2022-06-28';

// You'll need to create this database in Notion and add the ID here
const INBODY_DATABASE_ID = process.env.NOTION_INBODY_DATABASE_ID || '';

/**
 * Get Notion API key from environment
 */
function getNotionApiKey(): string | null {
  return process.env.NOTION_API_KEY || null;
}

/**
 * Check if Notion InBody sync is configured
 */
export function isNotionInBodyConfigured(): boolean {
  return Boolean(getNotionApiKey() && INBODY_DATABASE_ID);
}

/**
 * InBody scan data for Notion
 */
export interface NotionInBodyScan {
  scanDate: string;  // YYYY-MM-DD
  weightKg: number;
  bodyFatPercent: number;
  muscleMassKg: number;
  bodyFatMassKg?: number;
  bmi?: number;
  bmr?: number;
  visceralFatLevel?: number;
  inbodyScore?: number;
  totalBodyWaterL?: number;
  locationName?: string;
  notes?: string;
}

/**
 * Create a new InBody scan entry in Notion
 */
export async function createNotionInBodyEntry(
  scan: NotionInBodyScan
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  const apiKey = getNotionApiKey();

  if (!apiKey) {
    console.log('[NOTION INBODY] Notion API key not configured, skipping sync');
    return { success: false, error: 'NOTION_API_KEY not configured' };
  }

  if (!INBODY_DATABASE_ID) {
    console.log('[NOTION INBODY] InBody database ID not configured, skipping sync');
    return { success: false, error: 'NOTION_INBODY_DATABASE_ID not configured' };
  }

  try {
    // Build properties object for Notion
    const properties: Record<string, unknown> = {
      // Title property (required) - use scan date as title
      'Name': {
        title: [
          {
            text: {
              content: `InBody Scan - ${scan.scanDate}`,
            },
          },
        ],
      },
      // Date property
      'Scan Date': {
        date: {
          start: scan.scanDate,
        },
      },
      // Number properties
      'Weight (kg)': {
        number: scan.weightKg,
      },
      'Body Fat %': {
        number: scan.bodyFatPercent,
      },
      'Muscle Mass (kg)': {
        number: scan.muscleMassKg,
      },
    };

    // Add optional properties if provided
    if (scan.bodyFatMassKg !== undefined) {
      properties['Body Fat Mass (kg)'] = { number: scan.bodyFatMassKg };
    }
    if (scan.bmi !== undefined) {
      properties['BMI'] = { number: scan.bmi };
    }
    if (scan.bmr !== undefined) {
      properties['BMR'] = { number: scan.bmr };
    }
    if (scan.visceralFatLevel !== undefined) {
      properties['Visceral Fat'] = { number: scan.visceralFatLevel };
    }
    if (scan.inbodyScore !== undefined) {
      properties['InBody Score'] = { number: scan.inbodyScore };
    }
    if (scan.totalBodyWaterL !== undefined) {
      properties['Total Body Water (L)'] = { number: scan.totalBodyWaterL };
    }
    if (scan.locationName) {
      properties['Location'] = {
        rich_text: [{ text: { content: scan.locationName } }],
      };
    }
    if (scan.notes) {
      properties['Notes'] = {
        rich_text: [{ text: { content: scan.notes } }],
      };
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: INBODY_DATABASE_ID },
        properties,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NOTION INBODY] Failed to create entry:', response.status, errorText);
      return { success: false, error: `Notion API error: ${response.status}` };
    }

    const data = await response.json();
    console.log('[NOTION INBODY] Created entry:', data.id);

    return { success: true, pageId: data.id };
  } catch (error) {
    console.error('[NOTION INBODY] Error creating entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Query recent InBody entries from Notion
 */
export async function queryNotionInBodyEntries(
  limit: number = 10
): Promise<{ success: boolean; entries?: NotionInBodyScan[]; error?: string }> {
  const apiKey = getNotionApiKey();

  if (!apiKey || !INBODY_DATABASE_ID) {
    return { success: false, error: 'Notion not configured for InBody' };
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${INBODY_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Notion-Version': NOTION_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: limit,
          sorts: [
            {
              property: 'Scan Date',
              direction: 'descending',
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Notion API error: ${response.status}` };
    }

    const data = await response.json();

    // Transform Notion pages to our format
    const entries: NotionInBodyScan[] = data.results.map((page: any) => ({
      scanDate: page.properties['Scan Date']?.date?.start || '',
      weightKg: page.properties['Weight (kg)']?.number || 0,
      bodyFatPercent: page.properties['Body Fat %']?.number || 0,
      muscleMassKg: page.properties['Muscle Mass (kg)']?.number || 0,
      bodyFatMassKg: page.properties['Body Fat Mass (kg)']?.number,
      bmi: page.properties['BMI']?.number,
      bmr: page.properties['BMR']?.number,
      visceralFatLevel: page.properties['Visceral Fat']?.number,
      inbodyScore: page.properties['InBody Score']?.number,
      totalBodyWaterL: page.properties['Total Body Water (L)']?.number,
      locationName: page.properties['Location']?.rich_text?.[0]?.text?.content,
      notes: page.properties['Notes']?.rich_text?.[0]?.text?.content,
    }));

    return { success: true, entries };
  } catch (error) {
    console.error('[NOTION INBODY] Error querying entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
