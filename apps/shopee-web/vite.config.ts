/// <reference types="vitest" />
import { defineConfig, type PluginOption } from 'vitest/config'
import { loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'
import os from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Workaround cho Windows path length issues
const isWindows = os.platform() === 'win32'
const customCacheDir = isWindows
  ? path.join(os.tmpdir(), 'vite-cache-shopee')
  : 'node_modules/.vite'

// Tách riêng config cho test và production
export default defineConfig(({ mode }) => {
  const isTest = mode === 'test'

  // Load VITE_ env vars với fallback về domain mặc định
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const SITE_URL = (env.VITE_SITE_URL || 'https://lehoangtrong.com').replace(/\/+$/, '')
  const API_ORIGIN = (() => {
    try {
      return new URL(env.VITE_API_BASE_URL || 'https://api-ecom.lehoangtrong.com/').origin
    } catch {
      return 'https://api-ecom.lehoangtrong.com'
    }
  })()

  // Plugin thay thế token domain trong index.html và sinh sitemap/robots khi build
  const domainInjectPlugin: Plugin = {
    name: 'shopee-domain-inject',
    transformIndexHtml(html: string): string {
      return html
        .replaceAll('%API_ORIGIN%', API_ORIGIN)
        .replaceAll('%SITE_URL%', SITE_URL)
    },
    closeBundle(): void {
      const distDir = path.resolve(__dirname, 'dist')

      // Sinh sitemap.xml với domain từ env
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/products</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/compare</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/register</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/forgot-password</loc>
    <changefreq>monthly</changefreq>
    <priority>0.2</priority>
  </url>
  <url>
    <loc>${SITE_URL}/reset-password</loc>
    <changefreq>monthly</changefreq>
    <priority>0.2</priority>
  </url>
</urlset>
`
      // Sinh robots.txt với Sitemap URL từ env
      const robotsTxt = `User-agent: *
Allow: /
Disallow: /user/
Disallow: /cart
Disallow: /checkout

Sitemap: ${SITE_URL}/sitemap.xml
`
      fs.writeFileSync(path.resolve(distDir, 'sitemap.xml'), sitemapXml, 'utf-8')
      fs.writeFileSync(path.resolve(distDir, 'robots.txt'), robotsTxt, 'utf-8')
    },
  }

  const baseConfig = {
    plugins: [
      tailwindcss(),
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', {}]],
        },
      }),
      visualizer(),
      ...(!isTest
        ? [
            compression({ algorithm: 'gzip', threshold: 1024, deleteOriginalAssets: false }),
            compression({
              algorithm: 'brotliCompress',
              threshold: 1024,
              deleteOriginalAssets: false,
              ext: '.br',
            }),
            domainInjectPlugin,
          ]
        : []),
    ] as PluginOption[],
    // Base URL cho production deployment
    base: '/',
    server: {
      port: 4000,
      host: true,
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
    },
    preview: {
      port: 4173,
      host: true,
    },
    // Tối ưu cho Windows - sử dụng temp directory
    optimizeDeps: {
      esbuildOptions: {
        // Tăng buffer size cho Windows
        target: 'es2020',
      },
    },
    css: {
      devSourcemap: true,
    },
    resolve: {
      alias: {
        src: path.resolve(__dirname, './src'),
        '@shopee/shared-types': path.resolve(__dirname, '../../libs/shared-types/src'),
        '@shopee/shared-utils': path.resolve(__dirname, '../../libs/shared-utils/src'),
        '@shopee/shared-constants': path.resolve(__dirname, '../../libs/shared-constants/src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    // Cấu hình cache để tránh conflict trên Windows - sử dụng system temp
    cacheDir: customCacheDir,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'esbuild' as const,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core - must be in its own chunk, loaded first
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-vendor'
            }
            // Router
            if (id.includes('node_modules/react-router') || id.includes('node_modules/nuqs')) {
              return 'router-vendor'
            }
            // framer-motion - separate chunk (used in 82+ app files, independent of HeroUI)
            if (id.includes('node_modules/framer-motion')) {
              return 'motion-vendor'
            }
            // HeroUI only (system + tooltip + theme + aria-utils)
            if (id.includes('node_modules/@heroui/')) {
              return 'heroui-vendor'
            }
            // Forms
            if (
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod')
            ) {
              return 'form-vendor'
            }
            // HTTP (exclude devtools to avoid circular deps)
            if (
              id.includes('node_modules/axios') ||
              (id.includes('node_modules/@tanstack/react-query') && !id.includes('devtools'))
            ) {
              return 'http-vendor'
            }
            // DnD
            if (id.includes('node_modules/@dnd-kit/')) {
              return 'dnd-vendor'
            }
            // i18n
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
              return 'i18n-vendor'
            }
            // Floating UI (tooltip/popover positioning)
            if (id.includes('node_modules/@floating-ui/')) {
              return 'floating-vendor'
            }
            // Toast notifications
            if (id.includes('node_modules/react-toastify')) {
              return 'toast-vendor'
            }
            // Misc vendor (sanitization, SEO, etc.)
            if (
              id.includes('node_modules/react-helmet-async') ||
              id.includes('node_modules/dompurify') ||
              id.includes('node_modules/html-to-text')
            ) {
              return 'misc-vendor'
            }
            // Utils (small, no React dependency)
            if (
              id.includes('node_modules/classnames') ||
              id.includes('node_modules/immer') ||
              id.includes('node_modules/date-fns')
            ) {
              return 'utils-vendor'
            }
            // Everything else (socket.io, devtools, etc.) goes into default chunks
          },
        },
      },
    },
    ssr: {
      noExternal: ['@tanstack/react-query'],
    },
  }

  // CHỈ thêm test config khi đang trong test mode
  if (isTest) {
    return {
      ...baseConfig,
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.polyfills.js', './vitest.setup.js'],
        css: true,
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 3000,
        pool: 'vmForks',
        maxWorkers: 2,
        fileParallelism: true,
        isolate: true,
        memoryLimit: process.env.CI ? '512MB' : undefined,
        include: [
          'src/**/*.test.{ts,tsx}', // Unit tests
          'test/**/*.test.{ts,tsx}', // Integration & E2E tests
        ],
        exclude: [
          'test/integration/websocket.test.tsx', // Temporarily excluded — socket mock issues
        ],
        reporters: ['default', 'junit'],
        outputFile: {
          junit: './test-results/junit-report.xml',
        },
        // Suppress SSL/TLS errors from socket cleanup in CI
        onConsoleLog(log) {
          if (log.includes('ECANCELED') || log.includes('SSL destruction')) {
            return false // suppress
          }
        },
        coverage: {
          provider: 'v8',
          reporter: ['json', 'json-summary', 'text-summary', 'lcov'],
          reportsDirectory: './coverage',
          include: ['src/**/*.{ts,tsx}'],
          exclude: [
            'src/**/*.test.{ts,tsx}',
            'src/stories/**',
            'src/msw/**',
            'src/types/**',
            'src/NotePage/**',
            'src/@types/**',
            'src/locales/**',
            'src/data/**',
            'src/vite-env.d.ts',
          ],
          thresholds: {
            lines: 0,
            functions: 0,
            branches: 0,
            statements: 0,
          },
        },
      },
    }
  }

  // Production build - KHÔNG có test config
  return baseConfig
})
