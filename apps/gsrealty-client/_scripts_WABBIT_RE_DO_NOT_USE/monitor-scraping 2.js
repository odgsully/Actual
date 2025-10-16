#!/usr/bin/env node

/**
 * Monitoring Script for Property Scraping System
 * Run this to check the health and status of your scraping system
 */

const https = require('https');
const http = require('http');

// Configuration
const PRODUCTION_URL = 'https://actual-1vmhv4xlo-odgsullys-projects.vercel.app';
const LOCAL_URL = 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || '0432ad329ba9f7176235c76f441e0eff0b0b26fba15bb5a842931564302c310d';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// Check system health
async function checkHealth(isLocal = false) {
  const baseUrl = isLocal ? LOCAL_URL : PRODUCTION_URL;
  console.log(`\n${colors.blue}Checking ${isLocal ? 'Local' : 'Production'} System Health...${colors.reset}`);
  
  try {
    const health = await makeRequest(`${baseUrl}/api/health`);
    if (health.status === 200) {
      console.log(`${colors.green}✓${colors.reset} API Health: ${colors.bright}Healthy${colors.reset}`);
      console.log(`  - Environment: ${health.data.environment}`);
      console.log(`  - Version: ${health.data.version}`);
      console.log(`  - Database: ${health.data.database}`);
      console.log(`  - Uptime: ${Math.floor(health.data.uptime / 60)} minutes`);
    } else {
      console.log(`${colors.red}✗${colors.reset} API Health Check Failed (Status: ${health.status})`);
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Cannot connect to ${isLocal ? 'local' : 'production'} server`);
    if (isLocal) {
      console.log(`  ${colors.yellow}Tip: Start local server with 'npm run dev'${colors.reset}`);
    }
  }
}

// Check monitoring dashboard
async function checkMonitoring(isLocal = false) {
  const baseUrl = isLocal ? LOCAL_URL : PRODUCTION_URL;
  console.log(`\n${colors.blue}Fetching Monitoring Data...${colors.reset}`);
  
  try {
    const monitoring = await makeRequest(`${baseUrl}/api/admin/monitoring`);
    if (monitoring.status === 200 && monitoring.data) {
      const data = monitoring.data;
      
      // Queue Status
      console.log(`\n${colors.cyan}Queue Status:${colors.reset}`);
      if (data.queue && data.queue.stats) {
        data.queue.stats.forEach(source => {
          console.log(`  ${source.source}: ${source.pending} pending, ${source.active} active`);
        });
        console.log(`  Total Active Jobs: ${data.queue.activeJobs || 0}`);
      }
      
      // System Health
      if (data.health) {
        console.log(`\n${colors.cyan}System Health:${colors.reset}`);
        console.log(`  Status: ${data.health.status === 'healthy' ? colors.green + '✓' : colors.red + '✗'} ${data.health.status}${colors.reset}`);
        console.log(`  Error Rate: ${data.health.errorRate || 0}%`);
        console.log(`  Blocked URLs: ${data.health.blockedUrls || 0}`);
      }
      
      // Recent Activity
      if (data.recentActivity && data.recentActivity.length > 0) {
        console.log(`\n${colors.cyan}Recent Activity:${colors.reset}`);
        data.recentActivity.slice(0, 5).forEach(activity => {
          const time = new Date(activity.created_at).toLocaleTimeString();
          console.log(`  [${time}] ${activity.source}: ${activity.properties_found || 0} found, ${activity.properties_saved || 0} saved`);
        });
      } else {
        console.log(`\n${colors.yellow}No recent scraping activity${colors.reset}`);
      }
      
      // Summary Stats
      if (data.summary) {
        console.log(`\n${colors.cyan}24-Hour Summary:${colors.reset}`);
        console.log(`  Total Properties Scraped: ${data.summary.totalProperties || 0}`);
        console.log(`  Active Users: ${data.summary.activeUsers || 0}`);
        console.log(`  Total Notifications: ${data.summary.totalNotifications || 0}`);
      }
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Failed to fetch monitoring data: ${error.message}`);
  }
}

// Check cron job status
async function checkCronStatus() {
  console.log(`\n${colors.blue}Cron Job Schedule:${colors.reset}`);
  
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  
  const next15Min = new Date(now);
  const minutes = Math.ceil(now.getMinutes() / 15) * 15;
  next15Min.setMinutes(minutes, 0, 0);
  
  const next3AM = new Date(now);
  next3AM.setHours(3, 0, 0, 0);
  if (next3AM <= now) {
    next3AM.setDate(next3AM.getDate() + 1);
  }
  
  console.log(`  ${colors.cyan}Hourly Scrape:${colors.reset} Next run at ${nextHour.toLocaleTimeString()} (in ${Math.round((nextHour - now) / 60000)} minutes)`);
  console.log(`  ${colors.cyan}Health Check:${colors.reset} Next run at ${next15Min.toLocaleTimeString()} (in ${Math.round((next15Min - now) / 60000)} minutes)`);
  console.log(`  ${colors.cyan}Daily Cleanup:${colors.reset} Next run at ${next3AM.toLocaleString()}`);
}

// Trigger manual scrape
async function triggerManualScrape() {
  console.log(`\n${colors.blue}Triggering Manual Scrape...${colors.reset}`);
  
  const url = `${PRODUCTION_URL}/api/cron/hourly-scrape`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(url, options);
    if (response.status === 200) {
      console.log(`${colors.green}✓${colors.reset} Manual scrape triggered successfully!`);
      if (response.data) {
        console.log(`  Jobs Created: ${response.data.jobs_created || 0}`);
        console.log(`  Users Processed: ${response.data.users_processed || 0}`);
        console.log(`  Duration: ${response.data.duration || 0}ms`);
      }
    } else {
      console.log(`${colors.red}✗${colors.reset} Failed to trigger scrape (Status: ${response.status})`);
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Error triggering scrape: ${error.message}`);
  }
}

// Main monitoring function
async function main() {
  console.log(`${colors.bright}\n🏠 Wabbit Property Scraping Monitor${colors.reset}`);
  console.log('=' .repeat(50));
  
  const args = process.argv.slice(2);
  const isLocal = args.includes('--local');
  const shouldTrigger = args.includes('--trigger');
  
  // Check health
  await checkHealth(isLocal);
  
  // Check monitoring
  await checkMonitoring(isLocal);
  
  // Show cron schedule
  await checkCronStatus();
  
  // Trigger manual scrape if requested
  if (shouldTrigger) {
    await triggerManualScrape();
  }
  
  console.log(`\n${colors.bright}Tips:${colors.reset}`);
  console.log(`  • Run with --local to check local server`);
  console.log(`  • Run with --trigger to manually start a scrape`);
  console.log(`  • Check Vercel Dashboard for detailed logs`);
  console.log(`  • Monitor Supabase for database activity`);
  
  console.log('\n' + '=' .repeat(50));
}

// Run the monitor
main().catch(console.error);