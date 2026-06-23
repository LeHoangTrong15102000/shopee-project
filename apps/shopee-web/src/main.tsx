import { HeroUIProvider } from '@heroui/system'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { domAnimation, LazyMotion } from 'framer-motion'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router'
import App from 'src/App'
import 'src/i18n/i18n'
import ErrorBoundary from './components/ErrorBoundary'
import { AppProvider } from './contexts/app.context'
import { SocketProvider } from './contexts/socket.context'
import { ThemeProvider } from './contexts/theme.context'
import './index.css'

// Lazy load ReactQueryDevtools - chỉ load trong development
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((mod) => ({
    default: mod.ReactQueryDevtools,
  })),
)

// Khi mà thằng này dùng như context thì chúng ta có thể dùng hook để lấy ra được thằng này
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // để không gọi lại APi mỗi lần focusWindow
      retry: 0, // Không cho nó retry lại, khi mà gọi Api sai thì báo lỗi 1 lần
      staleTime: 3 * 60 * 1000, // 3 phút - data được coi là fresh trong 3 phút
      gcTime: 10 * 60 * 1000, // 10 phút - giữ cache trong 10 phút sau khi inactive
    },
  },
})

// Thay vì export cái queryClient tại đây để sử dụng ở các component thì chúng ta có thể sử dụng hook useQueryClient để lấy ra cái queryClient

// Production error logging - sử dụng import.meta.env của Vite
if (import.meta.env.PROD) {
  window.addEventListener('error', (event) => {
    console.error('Production Error:', event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
  })
}

// Mocks are enabled in dev or when VITE_ENABLE_MOCKS=true is set explicitly.
// This single boolean is the source of truth used by both startMocking() and
// the sw.js registration guard below so the two can never disagree.
const mocksEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true'

// Register Service Worker - only in production and only when mocks are not
// active, because both cannot control the page at the same scope simultaneously.
if ('serviceWorker' in navigator && import.meta.env.PROD && !mocksEnabled) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service Worker registration failed:', error)
    })
  })
}

function startMocking(): void {
  if (!mocksEnabled) {
    return
  }
  // Import mock-control synchronously-from-async so window.__mocks__ is
  // available before the first render. Worker startup runs in the background;
  // a slow or failing first-load service-worker activation must never keep
  // #root blank.
  void import('./mocks/mockControl').then(
    ({ setWorkerActive, enable, disable, toggle, list, reset }) => {
      // Expose console API immediately — mocks are ON by default once this
      // module loads; use window.__mocks__.disable('<domain>') to opt out.
      window.__mocks__ = { enable, disable, toggle, list, reset }

      import('./mocks/browser')
        .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
        .then(() => {
          setWorkerActive()
          // The app renders before worker.start() resolves, so any query that
          // fired during that window already resolved against the real backend
          // (or failed) and React Query cached that result. Invalidate every
          // active query now that the worker is intercepting so they refetch
          // through the mock handlers instead of showing stale empty data.
          void queryClient.invalidateQueries()
        })
        .catch((error: unknown) => {
          console.error('MSW worker startup failed, requests will use real backend:', error)
        })
    },
  )
}

function renderApp(): void {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <NuqsAdapter>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              <AppProvider>
                <SocketProvider>
                  <HelmetProvider>
                    <HeroUIProvider>
                      <LazyMotion features={domAnimation}>
                        <ErrorBoundary>
                          <App />
                          {/* CHỈ render ReactQueryDevtools trong development */}
                          {import.meta.env.DEV && (
                            <Suspense fallback={null}>
                              <ReactQueryDevtools initialIsOpen={false} />
                            </Suspense>
                          )}
                        </ErrorBoundary>
                      </LazyMotion>
                    </HeroUIProvider>
                  </HelmetProvider>
                </SocketProvider>
              </AppProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </BrowserRouter>
    </React.StrictMode>,
  )
}

// Render immediately so #root is never left blank due to a slow or stuck
// first-load MSW service-worker activation. MSW starts asynchronously in
// the background; requests that race with worker activation fall through to
// the real backend and are re-intercepted once the worker is ready.
startMocking()
renderApp()
