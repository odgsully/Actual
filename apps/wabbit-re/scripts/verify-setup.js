#!/usr/bin/env node

/**
 * Setup verification script for Wabbit Property Scraping System
 * Run with: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

// Check if file exists
function fileExists(filepath) {
  return fs.existsSync(path.join(process.cwd(), filepath));
}

// Check if environment variable is set
function envVarExists(varName) {
  return process.env[varName] && process.env[varName] !== '' && 
         !process.env[varName].includes('your_') && 
         !process.env[varName].includes('_here');
}

// Check npm package installed
function packageInstalled(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch (e) {
    return false;
  }
}

// Main verification function
async function verifySetup() {
  console.log(colors.bold + '\n🔍 Wabbit Property Scraping - Setup Verification\n' + colors.reset);
  
  let issuesFound = 0;
  
  // 1. Check Environment Configuration
  log.header('1. Environment Configuration');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'OPENAI_API_KEY'
  ];
  
  const optionalEnvVars = [
    'CRON_SECRET',
    'ALERT_WEBHOOK_URL',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  // Load .env.local if it exists
  if (fileExists('.env.local')) {
    require('dotenv').config({ path: '.env.local' });
    log.success('.env.local file found');
  } else {
    log.error('.env.local file not found');
    issuesFound++;
  }
  
  console.log('\nRequired Variables:');
  requiredEnvVars.forEach(varName => {
    if (envVarExists(varName)) {
      log.success(`${varName} is configured`);
    } else {
      log.error(`${varName} is missing or not configured`);
      issuesFound++;
    }
  });
  
  console.log('\nOptional Variables:');
  optionalEnvVars.forEach(varName => {
    if (envVarExists(varName)) {
      log.success(`${varName} is configured`);
    } else {
      log.warning(`${varName} is not configured (optional)`);
    }
  });
  
  // 2. Check Database Files
  log.header('2. Database Setup Files');
  
  const dbFiles = [
    'ref/sql/database-schema.sql',
    'migrations/002_add_scraping_tables.sql'
  ];
  
  dbFiles.forEach(file => {
    if (fileExists(file)) {
      log.success(`${file} exists`);
    } else {
      log.error(`${file} not found`);
      issuesFound++;
    }
  });
  
  // 3. Check Scraper Files
  log.header('3. Scraper Implementation');
  
  const scraperFiles = [
    'lib/scraping/scrapers/zillow-scraper.ts',
    'lib/scraping/scrapers/redfin-scraper.ts',
    'lib/scraping/scrapers/homes-scraper.ts',
    'lib/scraping/queue-manager.ts',
    'lib/scraping/property-scraper.ts',
    'lib/pipeline/data-normalizer.ts',
    'lib/database/property-manager.ts'
  ];
  
  scraperFiles.forEach(file => {
    if (fileExists(file)) {
      log.success(`${file} exists`);
    } else {
      log.error(`${file} not found`);
      issuesFound++;
    }
  });
  
  // 4. Check API Endpoints
  log.header('4. API Endpoints');
  
  const apiEndpoints = [
    'app/api/cron/hourly-scrape/route.ts',
    'app/api/cron/daily-cleanup/route.ts',
    'app/api/cron/check-health/route.ts',
    'app/api/scrape/test/route.ts',
    'app/api/scrape/on-demand/route.ts',
    'app/api/admin/monitoring/route.ts'
  ];
  
  apiEndpoints.forEach(file => {
    if (fileExists(file)) {
      log.success(`${file} exists`);
    } else {
      log.error(`${file} not found`);
      issuesFound++;
    }
  });
  
  // 5. Check Dependencies
  log.header('5. Required Dependencies');
  
  const requiredPackages = [
    'playwright',
    'sharp',
    '@supabase/supabase-js',
    'next',
    'react',
    'typescript'
  ];
  
  requiredPackages.forEach(pkg => {
    if (packageInstalled(pkg)) {
      log.success(`${pkg} is installed`);
    } else {
      log.error(`${pkg} is not installed`);
      issuesFound++;
    }
  });
  
  // 6. Check Vercel Configuration
  log.header('6. Vercel Configuration');
  
  if (fileExists('vercel.json')) {
    log.success('vercel.json exists');
    
    // Check cron configuration
    try {
      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
      if (vercelConfig.crons && vercelConfig.crons.length > 0) {
        log.success(`${vercelConfig.crons.length} cron jobs configured`);
        vercelConfig.crons.forEach(cron => {
          log.info(`  - ${cron.path} @ ${cron.schedule}`);
        });
      } else {
        log.warning('No cron jobs configured in vercel.json');
      }
    } catch (e) {
      log.error('Could not parse vercel.json');
      issuesFound++;
    }
  } else {
    log.error('vercel.json not found');
    issuesFound++;
  }
  
  // 7. Test Supabase Connection (if configured)
  log.header('7. Database Connection');
  
  if (envVarExists('NEXT_PUBLIC_SUPABASE_URL') && envVarExists('SUPABASE_SERVICE_ROLE_KEY')) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      // Test connection by checking if properties table exists
      const { error } = await supabase.from('properties').select('count').limit(1);
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          log.warning('Connected to Supabase but tables not created yet');
          log.info('Run database migrations to create tables');
        } else {
          log.error(`Supabase connection error: ${error.message}`);
          issuesFound++;
        }
      } else {
        log.success('Supabase connection successful');
      }
    } catch (e) {
      log.error(`Could not test Supabase connection: ${e.message}`);
      issuesFound++;
    }
  } else {
    log.warning('Supabase credentials not configured - skipping connection test');
  }
  
  // Summary
  log.header('Setup Summary');
  
  if (issuesFound === 0) {
    console.log(colors.green + colors.bold + '\n✅ All checks passed! System is ready for deployment.\n' + colors.reset);
    
    console.log('Next steps:');
    console.log('1. Run database migrations if not done');
    console.log('2. Test scrapers locally: npm run dev');
    console.log('3. Deploy to Vercel: vercel --prod');
    console.log('4. Monitor first cron run in Vercel dashboard');
  } else {
    console.log(colors.red + colors.bold + `\n❌ ${issuesFound} issue(s) found. Please fix them before deployment.\n` + colors.reset);
    
    console.log('Common fixes:');
    console.log('1. Copy .env.sample to .env.local and fill in values');
    console.log('2. Run npm install to install missing packages');
    console.log('3. Ensure all scraper files are present');
    console.log('4. Configure Supabase project and add credentials');
  }
  
  // Provide setup commands
  log.header('Quick Setup Commands');
  
  console.log('# Install dependencies:');
  console.log('npm install');
  console.log('\n# Install Playwright browsers:');
  console.log('npx playwright install chromium');
  console.log('\n# Create .env.local from template:');
  console.log('cp .env.sample .env.local');
  console.log('\n# Run database migrations (after configuring Supabase):');
  console.log('npm run db:migrate');
  console.log('\n# Test scrapers locally:');
  console.log('npm run dev');
  console.log('# Then visit: http://localhost:3000/api/scrape/test');
  console.log('\n# Deploy to Vercel:');
  console.log('vercel --prod');
}

// Run verification
verifySetup().catch(console.error);