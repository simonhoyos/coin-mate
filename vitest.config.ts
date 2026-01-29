import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

loadEnvFile('./.env.local');

(function isLocalDatabaseCheck() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl == null || databaseUrl.includes('localhost') !== true) {
    throw new Error('Cannot run test on a non-local database');
  }
})();

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'server-only': resolve(__dirname, './global.d.ts'),
    },
  },
});
