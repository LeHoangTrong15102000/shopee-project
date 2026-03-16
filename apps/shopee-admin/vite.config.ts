/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test'

  const baseConfig = {
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
      minify: 'esbuild' as const,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
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
  }

  if (isTest) {
    return {
      ...baseConfig,
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        css: true,
        testTimeout: 30000,
        pool: 'forks',
        maxForks: 2,
        include: [
          'src/**/*.test.{ts,tsx}',
          'test/**/*.test.{ts,tsx}',
        ],
        coverage: {
          provider: 'v8' as const,
          reporter: ['text', 'html', 'lcov'],
          reportsDirectory: './coverage',
          include: ['src/**/*.{ts,tsx}'],
          exclude: [
            'src/**/*.test.{ts,tsx}',
            'src/components/ui/**',
            'src/types/**',
            'src/vite-env.d.ts',
            'src/main.tsx',
            'src/msw/**',
            'src/mocks/**',
            'src/test-utils/**',
            'src/@types/**',
            'src/locales/**',
            'src/i18n/**',
            'src/router.tsx',
          ],
          thresholds: {
            lines: 68,
            functions: 55,
            branches: 55,
            statements: 68,
          },
        },
      },
    }
  }

  return baseConfig
})

