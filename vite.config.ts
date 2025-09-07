import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react({
      // Voeg JSX runtime toe voor moderne React
      jsxRuntime: 'automatic'
    })],
    // Define `process.env` to expose environment variables to the client.
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        '@components': path.resolve(__dirname, './components'),
        '@contexts': path.resolve(__dirname, './contexts'),
        '@services': path.resolve(__dirname, './services'),
        '@utils': path.resolve(__dirname, './utils')
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      open: true,
      // Voeg HMR-optimalisaties toe
      hmr: {
        protocol: 'ws',
        host: 'localhost'
      }
    },
    // Build-optimalisaties voor productie
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom']
          }
        }
      }
    },
    // CSS-optimalisaties
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      postcss: './postcss.config.cjs'
    }
  };
});