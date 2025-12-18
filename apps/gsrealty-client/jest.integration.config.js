/**
 * Jest Configuration for Integration Tests
 */

const { createDefaultPreset } = require("ts-jest");
require('dotenv').config({ path: '.env.local' });

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  displayName: 'Integration Tests',
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },

  // Only run integration tests
  testMatch: [
    "**/__tests__/integration/**/*.test.ts",
  ],

  // Ignore unit and e2e tests
  testPathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/unit/",
    "/tests/e2e/",
  ],

  // Setup and teardown
  globalSetup: "./__tests__/integration/setup.ts",

  // Timeout for integration tests (longer than unit tests)
  testTimeout: 30000, // 30 seconds

  // Run tests sequentially to avoid conflicts
  maxWorkers: 1,

  // Verbose output
  verbose: true,

  // Coverage (optional)
  collectCoverageFrom: [
    "app/api/**/*.ts",
    "lib/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],

  // Coverage thresholds (optional)
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    },
  },
};
