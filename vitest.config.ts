import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'jobs-client'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  esbuild: {
    target: 'node18',
  },
});