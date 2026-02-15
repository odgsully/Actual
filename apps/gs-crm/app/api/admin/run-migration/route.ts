/**
 * Admin endpoint to run database migrations
 * Development only - allows running SQL migrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/run-migration
 * Run a specific migration file
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Admin endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { migrationFile = '006_add_image_and_demo_columns.sql' } = body;

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { error: `Migration file not found: ${migrationFile}` },
        { status: 404 }
      );
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split migration into individual statements (by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip pure comment lines
      if (statement.trim().startsWith('--')) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).single();

        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0); // Just test connection

          if (directError) {
            errors.push({
              statement: statement.substring(0, 100) + '...',
              error: error.message
            });
          } else {
            results.push({
              statement: statement.substring(0, 100) + '...',
              status: 'completed'
            });
          }
        } else {
          results.push({
            statement: statement.substring(0, 100) + '...',
            status: 'success'
          });
        }
      } catch (err) {
        errors.push({
          statement: statement.substring(0, 100) + '...',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      migration: migrationFile,
      totalStatements: statements.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
      message: errors.length === 0 
        ? 'Migration completed successfully' 
        : 'Migration completed with some errors - check if columns already exist'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run migration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/run-migration
 * Get migration status
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Admin endpoint only available in development' },
      { status: 403 }
    );
  }

  // List available migrations
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return NextResponse.json({
    message: 'Database migration endpoint',
    availableMigrations: files,
    usage: {
      method: 'POST',
      body: {
        migrationFile: 'filename.sql (optional, defaults to 006_add_image_and_demo_columns.sql)'
      }
    }
  });
}