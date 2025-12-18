#!/usr/bin/env node

/**
 * Scraper Testing Script for Wabbit Property System
 * Tests all three scrapers with real Maricopa County searches
 * Run with: node scripts/test-scrapers.js
 */

const readline = require('readline');
const https = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`)
};

// Test configurations for each scraper
const testConfigs = [
  {
    name: 'Zillow Scraper',
    source: 'zillow',
    tests: [
      {
        name: 'Scottsdale luxury homes',
        criteria: {
          city: 'Scottsdale',
          minPrice: 800000,
          maxPrice: 1500000,
          minBedrooms: 3
        }
      },
      {
        name: 'Phoenix starter homes',
        criteria: {
          city: 'Phoenix',
          minPrice: 300000,
          maxPrice: 500000,
          propertyTypes: ['single-family']
        }
      },
      {
        name: 'Mesa family homes',
        criteria: {
          city: 'Mesa',
          minBedrooms: 4,
          minBathrooms: 2,
          minSquareFeet: 2000
        }
      }
    ]
  },
  {
    name: 'Redfin Scraper',
    source: 'redfin',
    tests: [
      {
        name: 'Tempe near ASU',
        criteria: {
          city: 'Tempe',
          maxPrice: 600000,
          zipCodes: ['85281', '85282']
        }
      },
      {
        name: 'Chandler tech corridor',
        criteria: {
          city: 'Chandler',
          minPrice: 400000,
          maxPrice: 700000
        }
      },
      {
        name: 'Gilbert family neighborhoods',
        criteria: {
          city: 'Gilbert',
          minBedrooms: 3,
          poolPreference: 'required'
        }
      }
    ]
  },
  {
    name: 'Homes.com Scraper',
    source: 'homes.com',
    tests: [
      {
        name: 'Glendale affordable homes',
        criteria: {
          city: 'Glendale',
          maxPrice: 450000,
          minBedrooms: 2
        }
      },
      {
        name: 'Peoria golf communities',
        criteria: {
          city: 'Peoria',
          minPrice: 500000,
          hoaPreference: 'required'
        }
      },
      {
        name: 'Surprise retirement homes',
        criteria: {
          city: 'Surprise',
          propertyTypes: ['single-family'],
          homeStyle: 'single-story'
        }
      }
    ]
  }
];

// Function to test a single scraper endpoint
async function testScraper(source, criteria, testName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      source,
      searchCriteria: criteria,
      testMode: true
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/scrape/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          
          if (res.statusCode === 200) {
            resolve({
              success: true,
              data: result,
              testName
            });
          } else {
            resolve({
              success: false,
              error: result.error || 'Unknown error',
              statusCode: res.statusCode,
              testName
            });
          }
        } catch (e) {
          resolve({
            success: false,
            error: 'Failed to parse response',
            testName
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        success: false,
        error: e.message,
        testName
      });
    });

    req.write(data);
    req.end();
  });
}

// Function to display test results
function displayResults(scraperName, results) {
  log.header(`Results for ${scraperName}`);
  
  let totalProperties = 0;
  let successfulTests = 0;
  let failedTests = 0;
  
  results.forEach(result => {
    if (result.success) {
      const propertyCount = result.data.properties?.length || 0;
      totalProperties += propertyCount;
      successfulTests++;
      
      log.success(`${result.testName}: Found ${propertyCount} properties`);
      
      if (result.data.properties && result.data.properties.length > 0) {
        const sample = result.data.properties[0];
        console.log(`  Sample: ${sample.address || 'N/A'}, ${sample.city || 'N/A'} - $${sample.listPrice || 'N/A'}`);
      }
      
      if (result.data.metrics) {
        console.log(`  Metrics: ${JSON.stringify(result.data.metrics)}`);
      }
    } else {
      failedTests++;
      log.error(`${result.testName}: ${result.error}`);
    }
  });
  
  console.log('\nSummary:');
  console.log(`  Total Properties Found: ${totalProperties}`);
  console.log(`  Successful Tests: ${successfulTests}`);
  console.log(`  Failed Tests: ${failedTests}`);
  
  return { totalProperties, successfulTests, failedTests };
}

// Main test runner
async function runTests() {
  console.log(colors.bold + '\n🏠 Wabbit Property Scraper Test Suite\n' + colors.reset);
  console.log('Testing all scrapers with real Maricopa County searches...\n');
  
  // Check if dev server is running
  log.info('Checking if development server is running on port 3000...');
  
  const serverCheck = await new Promise((resolve) => {
    https.get('http://localhost:3000/api/health', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
  
  if (!serverCheck) {
    log.error('Development server is not running!');
    console.log('\nPlease start the server first:');
    console.log('  npm run dev\n');
    console.log('Then run this script again in another terminal.\n');
    process.exit(1);
  }
  
  log.success('Development server is running');
  
  // Overall statistics
  const overallStats = {
    totalProperties: 0,
    totalSuccess: 0,
    totalFailed: 0,
    scraperResults: []
  };
  
  // Test each scraper
  for (const config of testConfigs) {
    log.header(`Testing ${config.name}`);
    
    const results = [];
    
    for (const test of config.tests) {
      process.stdout.write(`  Testing "${test.name}"... `);
      
      const result = await testScraper(config.source, test.criteria, test.name);
      results.push(result);
      
      if (result.success) {
        console.log(colors.green + 'Done' + colors.reset);
      } else {
        console.log(colors.red + 'Failed' + colors.reset);
      }
      
      // Add delay between tests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const stats = displayResults(config.name, results);
    overallStats.totalProperties += stats.totalProperties;
    overallStats.totalSuccess += stats.successfulTests;
    overallStats.totalFailed += stats.failedTests;
    overallStats.scraperResults.push({
      scraper: config.name,
      ...stats
    });
  }
  
  // Display overall summary
  log.header('Overall Test Summary');
  
  console.log('Scraper Performance:');
  overallStats.scraperResults.forEach(result => {
    const status = result.failedTests === 0 ? colors.green + '✓' : colors.yellow + '⚠';
    console.log(`  ${status} ${result.scraper}: ${result.totalProperties} properties, ${result.successfulTests}/${result.successfulTests + result.failedTests} tests passed${colors.reset}`);
  });
  
  console.log('\nTotal Statistics:');
  console.log(`  Properties Found: ${overallStats.totalProperties}`);
  console.log(`  Successful Tests: ${overallStats.totalSuccess}`);
  console.log(`  Failed Tests: ${overallStats.totalFailed}`);
  
  const successRate = (overallStats.totalSuccess / (overallStats.totalSuccess + overallStats.totalFailed) * 100).toFixed(1);
  
  if (successRate === '100.0') {
    console.log(colors.green + colors.bold + `\n✅ All tests passed! (${successRate}% success rate)\n` + colors.reset);
    console.log('The scraping system is working correctly.');
    console.log('Ready for deployment to Vercel.');
  } else if (successRate >= 80) {
    console.log(colors.yellow + colors.bold + `\n⚠️  Most tests passed (${successRate}% success rate)\n` + colors.reset);
    console.log('Some scrapers may need attention before deployment.');
  } else {
    console.log(colors.red + colors.bold + `\n❌ Many tests failed (${successRate}% success rate)\n` + colors.reset);
    console.log('Please investigate failures before deployment.');
  }
  
  // Provide next steps
  log.header('Next Steps');
  
  if (overallStats.totalFailed === 0) {
    console.log('1. Deploy to Vercel: vercel --prod');
    console.log('2. Set up CRON_SECRET in Vercel environment');
    console.log('3. Monitor first hourly scrape in Vercel dashboard');
    console.log('4. Check /api/admin/monitoring for system status');
  } else {
    console.log('1. Check failed scraper logs for errors');
    console.log('2. Verify rate limiting is not too aggressive');
    console.log('3. Ensure Playwright browsers are installed: npx playwright install');
    console.log('4. Test individual scrapers with different criteria');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nTest suite interrupted by user.');
  process.exit(0);
});

// Run the tests
runTests().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  process.exit(1);
});