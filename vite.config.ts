    import { defineConfig, loadEnv } from 'vite';
    import react from '@vitejs/plugin-react';
    import tailwindcss from '@tailwindcss/vite';
    import tsconfigPaths from 'vite-plugin-tsconfig-paths';

    export default defineConfig(({ mode }) => {
      const env = loadEnv(mode, process.cwd(), '');

      return {
        plugins: [
          react({
            jsxRuntime: 'automatic'
          }),
          tailwindcss(),
          tsconfigPaths()
        ],
        define: {
          'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
          'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        },
        server: {
          port: 5173,
          strictPort: true,
          open: true,
          hmr: {
            protocol: 'ws',
            host: 'localhost'
          }
        },
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
        }
      };
    });
    
