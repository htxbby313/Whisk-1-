import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const disableViteClientWsPlugin = () => ({
  name: 'whisk:disable-hmr-client-ws',
  apply: 'serve' as const,
  enforce: 'post' as const,
  transform(code: string, id: string) {
    if (id.includes('vite/dist/client/client.mjs')) {
      return code.replace(
        'transport.connect(createHMRHandler(handleMessage));',
        '/* HMR WebSocket disabled */'
      );
    }
    return null;
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(
        env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || ''
      ),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: false,
      ws: false,
    },
    plugins: [react(), disableViteClientWsPlugin()],
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'ui-vendor': ['lucide-react', '@vis.gl/react-google-maps'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
