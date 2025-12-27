import { NextRequest, NextResponse } from 'next/server';

/**
 * Tile Settings API
 *
 * GET /api/admin/settings - Get all settings or specific tile
 * POST /api/admin/settings - Save settings for a tile
 * DELETE /api/admin/settings - Reset settings for a tile
 *
 * Note: This is a simple in-memory/localStorage implementation.
 * For production, migrate to Supabase with the tile_settings table.
 */

// In-memory storage for server-side (will reset on server restart)
// In production, use Supabase
const serverSettings: Record<string, Record<string, unknown>> = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tileId = searchParams.get('tile');

    if (tileId) {
      // Return specific tile settings
      const settings = serverSettings[tileId] || null;
      return NextResponse.json({ tileId, settings });
    }

    // Return all settings
    return NextResponse.json({ settings: serverSettings });
  } catch (error) {
    console.error('Error getting tile settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tileId, settings } = body;

    if (!tileId) {
      return NextResponse.json(
        { error: 'tileId is required' },
        { status: 400 }
      );
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'settings object is required' },
        { status: 400 }
      );
    }

    // Save settings
    serverSettings[tileId] = {
      ...serverSettings[tileId],
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      tileId,
      settings: serverSettings[tileId],
    });
  } catch (error) {
    console.error('Error saving tile settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tileId = searchParams.get('tile');

    if (!tileId) {
      return NextResponse.json(
        { error: 'tile parameter is required' },
        { status: 400 }
      );
    }

    // Delete settings for tile
    delete serverSettings[tileId];

    return NextResponse.json({
      success: true,
      message: `Settings for ${tileId} reset to defaults`,
    });
  } catch (error) {
    console.error('Error deleting tile settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete settings' },
      { status: 500 }
    );
  }
}
