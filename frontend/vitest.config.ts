import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      VITE_NAMI_DEV_FIXTURES: 'true',
    },
  },
});