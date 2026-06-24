import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'src/components/ui/sonner'
import { useWebVitals } from '@shopee/shared-utils'
import './i18n/i18n'
import { router } from './router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
})

function WebVitalsTracker() {
  useWebVitals()
  return null
}

const startApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
        <WebVitalsTracker />
      </QueryClientProvider>
    </React.StrictMode>,
  )
}

// MSW browser mocks have been removed entirely. On startup we proactively
// unregister any stale MSW service worker left over from older builds so it
// can no longer intercept real API requests, then render the app.
const unregisterStaleServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) return
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
  } catch {
    // swallow — never block app startup
  }
}

unregisterStaleServiceWorkers().finally(startApp)
