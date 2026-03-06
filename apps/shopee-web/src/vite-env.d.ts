/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SOCKET_URL?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_LOGIN_REDIRECT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
