import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - split by library
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            if (id.includes('@auth0')) {
              return 'vendor-auth';
            }
            if (id.includes('@stripe')) {
              return 'vendor-stripe';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('@google')) {
              return 'vendor-google';
            }
            // All other node_modules
            return 'vendor-other';
          }
          // Split large page components into separate chunks
          if (id.includes('src/pages/QuestionnaireFlow') || id.includes('src/components/questionnaire')) {
            return 'page-questionnaire';
          }
          if (id.includes('src/pages/ESIMManagement') || id.includes('src/components/ESIM')) {
            return 'page-esim';
          }
          if (id.includes('src/pages/Dashboard')) {
            return 'page-dashboard';
          }
          if (id.includes('src/pages/PlanGeneration') || id.includes('src/components/GeneratedPlanDisplay')) {
            return 'page-plan-generation';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500,
    // Vercel用の最適化
    target: 'esnext',
    modulePreload: false,
    cssCodeSplit: true,
    reportCompressedSize: false
  },
  // PWAファイルの処理
  publicDir: 'public',
  base: '/',
  server: {
    port: 5173,
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    global: 'globalThis',
  },
  envPrefix: 'VITE_',
  // Vercel用の追加設定
  preview: {
    port: 4173,
    host: true
  }
})
  