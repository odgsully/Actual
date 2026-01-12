import { Tile, NotionTileProperties, notionToTile } from '../types/tiles';

// Tiles Database ID from Notion
const TILES_DATABASE_ID = '28fcf08f-4499-8017-b530-ff06c9f64f97';
const NOTION_API_VERSION = '2022-06-28';

/**
 * Get Notion API key from environment
 */
function getNotionApiKey(): string | null {
  const apiKey = process.env.NOTION_API_KEY;

  if (!apiKey) {
    console.warn(
      '⚠️ NOTION_API_KEY not found in environment variables.\n' +
      'Add NOTION_API_KEY to .env.local to enable Notion tiles integration.\n' +
      'Get your key from: https://www.notion.so/my-integrations'
    );
    return null;
  }

  return apiKey;
}

/**
 * Make a request to Notion API using native fetch
 */
async function notionFetch(endpoint: string, body?: object): Promise<any> {
  const apiKey = getNotionApiKey();

  if (!apiKey) {
    throw new Error('NOTION_API_KEY not configured');
  }

  const url = `https://api.notion.com/v1${endpoint}`;

  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export interface FetchTilesOptions {
  status?: 'Not started' | 'In progress' | 'Done';
  phase?: 'GS Site Standing' | 'Morning' | 'Evening';
}

/**
 * Fetch all tiles from the Notion Tiles database
 */
export async function fetchTiles(options: FetchTilesOptions = {}): Promise<Tile[]> {
  const apiKey = getNotionApiKey();

  if (!apiKey) {
    console.error('Notion client not initialized - NOTION_API_KEY missing');
    return [];
  }

  try {
    const body: any = {
      page_size: 100,
    };

    if (options.status) {
      body.filter = {
        property: 'Status',
        status: { equals: options.status },
      };
    }

    const response = await notionFetch(`/databases/${TILES_DATABASE_ID}/query`, body);

    const tiles = response.results.map((page: any) => {
      return notionToTile({
        id: page.id,
        properties: page.properties as NotionTileProperties,
      });
    });

    return tiles;
  } catch (error) {
    console.error('Error fetching tiles from Notion:', error);
    throw error;
  }
}

/**
 * Fetch tiles for a specific phase
 */
export async function fetchTilesByPhase(phase: 'GS Site Standing' | 'Morning' | 'Evening'): Promise<Tile[]> {
  const apiKey = getNotionApiKey();

  if (!apiKey) {
    return [];
  }

  try {
    const response = await notionFetch(`/databases/${TILES_DATABASE_ID}/query`, {
      filter: {
        property: 'Phase',
        multi_select: {
          contains: phase,
        },
      },
      page_size: 100,
    });

    return response.results.map((page: any) =>
      notionToTile({
        id: page.id,
        properties: page.properties as NotionTileProperties,
      })
    );
  } catch (error) {
    console.error(`Error fetching tiles for phase ${phase}:`, error);
    throw error;
  }
}

/**
 * Fetch tiles that have action warnings enabled
 */
export async function fetchWarningTiles(): Promise<Tile[]> {
  const apiKey = getNotionApiKey();

  if (!apiKey) {
    return [];
  }

  try {
    const response = await notionFetch(`/databases/${TILES_DATABASE_ID}/query`, {
      filter: {
        property: 'Action warning?',
        multi_select: {
          contains: 'Y',
        },
      },
      page_size: 100,
    });

    return response.results.map((page: any) =>
      notionToTile({
        id: page.id,
        properties: page.properties as NotionTileProperties,
      })
    );
  } catch (error) {
    console.error('Error fetching warning tiles:', error);
    throw error;
  }
}

/**
 * Fetch tiles by 3rd party integration type
 */
export async function fetchTilesByIntegration(integration: string): Promise<Tile[]> {
  const apiKey = getNotionApiKey();

  if (!apiKey) {
    return [];
  }

  try {
    const response = await notionFetch(`/databases/${TILES_DATABASE_ID}/query`, {
      filter: {
        property: '3rd P',
        multi_select: {
          contains: integration,
        },
      },
      page_size: 100,
    });

    return response.results.map((page: any) =>
      notionToTile({
        id: page.id,
        properties: page.properties as NotionTileProperties,
      })
    );
  } catch (error) {
    console.error(`Error fetching tiles for integration ${integration}:`, error);
    throw error;
  }
}

/**
 * Get a single tile by ID
 */
export async function fetchTileById(tileId: string): Promise<Tile | null> {
  const apiKey = getNotionApiKey();

  if (!apiKey) {
    return null;
  }

  try {
    const page = await notionFetch(`/pages/${tileId}`);

    return notionToTile({
      id: page.id,
      properties: page.properties as NotionTileProperties,
    });
  } catch (error) {
    console.error(`Error fetching tile ${tileId}:`, error);
    return null;
  }
}

/**
 * Check if Notion is configured
 */
export function isNotionConfigured(): boolean {
  return getNotionApiKey() !== null;
}
