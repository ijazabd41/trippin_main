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
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          motion: ['framer-motion'],
          icons: ['lucide-react'],
          i18n: ['i18next', 'react-i18next'],
          auth: ['@auth0/auth0-react'],
          seo: ['react-helmet-async']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Vercel用の最適化
    target: 'esnext',
    modulePreload: false
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
  