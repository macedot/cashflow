import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Test performance tracking - output timing for each test
    reporters: ['verbose'],
    // Test isolation - run tests in parallel (default)
    pool: 'forks',
    // Flaky test detection - retry failed tests in CI
    retry: process.env.CI ? 2 : 0,
    // Only run project test files (not node_modules)
    include: ['src/**/*.test.js'],
    // Exclude integration tests (run with Playwright, not Vitest)
    exclude: ['tests/integration/**'],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    reportsDirectory: './coverage',
    include: ['src/**/*.js'],
    exclude: ['**/*.test.js'],
    thresholds: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
});
