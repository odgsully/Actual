/**
 * One-time script to upload agent profile pics to Supabase Storage.
 *
 * Usage:
 *   npx tsx scripts/upload-profile-pics.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const BUCKET = 'agent-profile-pics';
const PICS_DIR = path.join(__dirname, '..', 'profile-pics');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const files = fs.readdirSync(PICS_DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  console.log(`Found ${files.length} images to upload:\n`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    // Normalize filename: lowercase, replace spaces with hyphens
    const normalizedName = file.toLowerCase().replace(/\s+/g, '-');
    const filePath = path.join(PICS_DIR, file);
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const contentType =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    const { error } = await supabase.storage.from(BUCKET).upload(normalizedName, buffer, {
      contentType,
      cacheControl: '31536000', // 1 year cache (these rarely change)
      upsert: true,
    });

    if (error) {
      console.error(`  FAIL: ${file} → ${normalizedName}: ${error.message}`);
      failed++;
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(normalizedName);
      console.log(`  OK: ${file} → ${urlData.publicUrl}`);
      success++;
    }
  }

  console.log(`\nDone: ${success} uploaded, ${failed} failed.`);
}

main();
