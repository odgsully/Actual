import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotionInBodyEntry, isNotionInBodyConfigured } from '@/lib/notion/inbody';

// Force dynamic - DB writes must not be cached
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/inbody/manual
 *
 * Create a new manual InBody scan entry.
 * Stores in Supabase and optionally syncs to Notion.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { scanDate, weightKg, bodyFatPercent, muscleMassKg } = body;

    if (!scanDate || !weightKg || bodyFatPercent === undefined || !muscleMassKg) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['scanDate', 'weightKg', 'bodyFatPercent', 'muscleMassKg'],
        },
        { status: 400 }
      );
    }

    // Validate numeric values
    if (isNaN(Number(weightKg)) || isNaN(Number(bodyFatPercent)) || isNaN(Number(muscleMassKg))) {
      return NextResponse.json(
        { error: 'Invalid numeric values' },
        { status: 400 }
      );
    }

    // For now, use default user
    const userId = 'default-user';

    // Calculate BMI if height is known (optional enhancement)
    // For now, accept BMI as input or leave null

    // Insert into Supabase
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('inbody_scans')
      .insert({
        user_id: userId,
        scan_date: scanDate,
        weight_kg: Number(weightKg),
        body_fat_percent: Number(bodyFatPercent),
        skeletal_muscle_mass_kg: Number(muscleMassKg),
        body_fat_mass_kg: body.bodyFatMassKg ? Number(body.bodyFatMassKg) : null,
        bmi: body.bmi ? Number(body.bmi) : null,
        bmr: body.bmr ? Number(body.bmr) : null,
        visceral_fat_level: body.visceralFatLevel ? Number(body.visceralFatLevel) : null,
        inbody_score: body.inbodyScore ? Number(body.inbodyScore) : null,
        total_body_water_l: body.totalBodyWaterL ? Number(body.totalBodyWaterL) : null,
        location_name: body.locationName || null,
        notes: body.notes || null,
        source: 'manual',
      })
      .select()
      .single();

    if (supabaseError) {
      console.error('[INBODY MANUAL] Supabase insert error:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to save scan data', details: supabaseError.message },
        { status: 500 }
      );
    }

    console.log('[INBODY MANUAL] Saved to Supabase:', supabaseData.id);

    // Sync to Notion if configured
    let notionResult = { success: false, pageId: undefined as string | undefined };

    if (isNotionInBodyConfigured()) {
      notionResult = await createNotionInBodyEntry({
        scanDate,
        weightKg: Number(weightKg),
        bodyFatPercent: Number(bodyFatPercent),
        muscleMassKg: Number(muscleMassKg),
        bodyFatMassKg: body.bodyFatMassKg ? Number(body.bodyFatMassKg) : undefined,
        bmi: body.bmi ? Number(body.bmi) : undefined,
        bmr: body.bmr ? Number(body.bmr) : undefined,
        visceralFatLevel: body.visceralFatLevel ? Number(body.visceralFatLevel) : undefined,
        inbodyScore: body.inbodyScore ? Number(body.inbodyScore) : undefined,
        totalBodyWaterL: body.totalBodyWaterL ? Number(body.totalBodyWaterL) : undefined,
        locationName: body.locationName,
        notes: body.notes,
      });

      // Update Supabase record with Notion page ID if sync succeeded
      if (notionResult.success && notionResult.pageId) {
        await supabase
          .from('inbody_scans')
          .update({ notion_page_id: notionResult.pageId })
          .eq('id', supabaseData.id);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: supabaseData.id,
        scanDate: supabaseData.scan_date,
        weightKg: supabaseData.weight_kg,
        bodyFatPercent: supabaseData.body_fat_percent,
        muscleMassKg: supabaseData.skeletal_muscle_mass_kg,
      },
      notionSynced: notionResult.success,
      notionPageId: notionResult.pageId,
    });
  } catch (error) {
    console.error('[INBODY MANUAL] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inbody/manual
 *
 * Retrieve all manual InBody scan entries.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  try {
    const userId = 'default-user';

    const { data, error } = await supabase
      .from('inbody_scans')
      .select('*')
      .eq('user_id', userId)
      .order('scan_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[INBODY MANUAL] Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scans' },
        { status: 500 }
      );
    }

    // Transform to frontend format
    const scans = data.map((row) => ({
      id: row.id,
      scanDate: row.scan_date,
      weightKg: row.weight_kg,
      bodyFatPercent: row.body_fat_percent,
      muscleMassKg: row.skeletal_muscle_mass_kg,
      bodyFatMassKg: row.body_fat_mass_kg,
      bmi: row.bmi,
      bmr: row.bmr,
      visceralFatLevel: row.visceral_fat_level,
      inbodyScore: row.inbody_score,
      totalBodyWaterL: row.total_body_water_l,
      locationName: row.location_name,
      notes: row.notes,
      source: row.source,
      notionPageId: row.notion_page_id,
      createdAt: row.created_at,
    }));

    // Calculate trends if we have multiple scans
    let trends = null;
    if (scans.length >= 2) {
      const newest = scans[0];
      const oldest = scans[scans.length - 1];

      trends = {
        weightChange: newest.weightKg - oldest.weightKg,
        fatChange: newest.bodyFatPercent - oldest.bodyFatPercent,
        muscleChange: newest.muscleMassKg - oldest.muscleMassKg,
        periodDays: Math.round(
          (new Date(newest.scanDate).getTime() - new Date(oldest.scanDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      };
    }

    return NextResponse.json({
      scans,
      count: scans.length,
      trends,
    });
  } catch (error) {
    console.error('[INBODY MANUAL] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
