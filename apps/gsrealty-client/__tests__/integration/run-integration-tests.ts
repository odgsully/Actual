/**
 * Integration Test Runner
 *
 * Runs all integration tests and generates summary report
 */

import { globalSetup, globalTeardown } from './setup';

async function runIntegrationTests() {
  console.log('='.repeat(80));
  console.log('GSRealty Client Management System - Integration Tests');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Setup
    await globalSetup();

    console.log('');
    console.log('Running integration tests...');
    console.log('This may take several minutes.');
    console.log('');

    // Tests will be run by Jest
    // This file just provides setup/teardown hooks

  } catch (error) {
    console.error('Test runner error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runIntegrationTests();
}

export default runIntegrationTests;
