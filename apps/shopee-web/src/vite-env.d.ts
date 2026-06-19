/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SOCKET_URL?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_LOGIN_REDIRECT_URL?: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_ENABLE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Runtime mock-control console API, exposed on `window` only when the MSW
// worker is active (see enableMocking() in main.tsx). Optional because it is
// absent in normal production builds where mocking never starts.
interface Window {
  __mocks__?: {
    enable: typeof import('./mocks/mockControl').enable
    disable: typeof import('./mocks/mockControl').disable
    toggle: typeof import('./mocks/mockControl').toggle
    list: typeof import('./mocks/mockControl').list
    reset: typeof import('./mocks/mockControl').reset
  }
}
