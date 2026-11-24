import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY
      ),
      'process.env.AFFILIATE_PARTNER_ID': JSON.stringify(
        env.AFFILIATE_PARTNER_ID || env.VITE_AFFILIATE_PARTNER_ID || '809946'
      ),
      'process.env.AFFILIATE_HOTELS_ID': JSON.stringify(
        env.AFFILIATE_HOTELS_ID || env.VITE_AFFILIATE_HOTELS_ID || '809946'
      ),
      'process.env.AFFILIATE_FLIGHTS_ID': JSON.stringify(
        env.AFFILIATE_FLIGHTS_ID || env.VITE_AFFILIATE_FLIGHTS_ID || '809946'
      ),
      'process.env.AFFILIATE_TOURS_ID': JSON.stringify(
        env.AFFILIATE_TOURS_ID || env.VITE_AFFILIATE_TOURS_ID || '809946'
      ),
      'process.env.AFFILIATE_DINING_ID': JSON.stringify(
        env.AFFILIATE_DINING_ID || env.VITE_AFFILIATE_DINING_ID || 'whisk'
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
    },
  };
});
