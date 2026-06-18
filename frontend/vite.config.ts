import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('SettingsScreen')) {
              return 'settings-screen';
            }

            if (id.includes('GuildSpaceScreens')) {
              return 'guild-screens';
            }

            if (id.includes('BadgeCollectorsBook')) {
              return 'badge-book';
            }

            return undefined;
          }

          if (id.includes('@mysten')) {
            return 'sui-vendor';
          }

          if (id.includes('@tanstack')) {
            return 'query-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
});