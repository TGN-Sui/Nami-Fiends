import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      VITE_NAMI_TEST_LAUNCH: 'false',
      VITE_NAMI_DEV_FIXTURES: 'true',
      VITE_NAMI_OFFICIAL_OWNER:
        '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca',
    },
  },
});