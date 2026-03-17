import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.dto.ts', 'src/**/*.module.ts', 'src/main.ts'],
    },
  },
  resolve: {
    alias: {
      '@compliancecore/sdk': path.resolve(__dirname, '../../packages/sdk/src'),
      '@compliancecore/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
