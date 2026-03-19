/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import compression from 'vite-plugin-compression';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test';

  const baseConfig = {
    plugins: [
      tailwindcss(),
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', {}]],
        },
      }),
      ...(!isTest
        ? [
            compression({ algorithm: 'gzip', threshold: 1024, deleteOriginalAssets: false }),
            compression({
              algorithm: 'brotliCompress',
              threshold: 1024,
              deleteOriginalAssets: false,
              ext: '.br',
            }),
          ]
        : []),
    ],
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
      dedupe: ['react', 'react-dom'],
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
              return 'react-vendor';
            }
            if (id.includes('node_modules/react-router')) {
              return 'router-vendor';
            }
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('node_modules/@tanstack/react-table')) {
              return 'table-vendor';
            }
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
              return 'chart-vendor';
            }
            if (id.includes('node_modules/@radix-ui/') || id.includes('node_modules/@base-ui/')) {
              return 'ui-vendor';
            }
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
              return 'i18n-vendor';
            }
            if (id.includes('node_modules/date-fns')) {
              return 'date-vendor';
            }
            if (id.includes('node_modules/sonner')) {
              return 'toast-vendor';
            }
          },
        },
      },
    },
  };

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
        include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
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
            lines: 85,
            functions: 76,
            branches: 70,
            statements: 84,
          },
        },
      },
    };
  }

  return baseConfig;
});
