import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 4001,
    host: true,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
      '@': path.resolve(__dirname, './src'),
      '@shopee/shared-types': path.resolve(__dirname, '../../libs/shared-types/src'),
      '@shopee/shared-utils': path.resolve(__dirname, '../../libs/shared-utils/src'),
      '@shopee/shared-constants': path.resolve(__dirname, '../../libs/shared-constants/src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor'
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor'
          }
          if (id.includes('node_modules/@tanstack/react-table')) {
            return 'table-vendor'
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'chart-vendor'
          }
          if (id.includes('node_modules/@radix-ui/') || id.includes('node_modules/@base-ui/')) {
            return 'ui-vendor'
          }
        },
      },
    },
  },
})

