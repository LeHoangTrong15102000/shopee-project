/// <reference types="vitest" />

import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { handlers } from './src/msw/handlers'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {}
  observe() {
    return
  }
  unobserve() {
    return
  }
  disconnect() {
    return
  }
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
} as unknown as typeof IntersectionObserver

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(public callback: ResizeObserverCallback) {}
  observe() {
    return
  }
  unobserve() {
    return
  }
  disconnect() {
    return
  }
} as unknown as typeof ResizeObserver

// Mock react-i18next
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next')
  return {
    ...actual,
    useTranslation: (ns: string | string[] = 'common') => ({
      t: (key: string) => key,
      i18n: {
        changeLanguage: vi.fn(),
        language: 'vi',
        hasResourceBundle: vi.fn().mockReturnValue(true),
        addResourceBundle: vi.fn(),
        getResourceBundle: vi.fn(),
      },
    }),
    initReactI18next: {
      type: '3rdParty',
      init: vi.fn(),
    },
    Trans: ({ children }: { children: React.ReactNode }) => children,
  }
})

// MSW server
export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

afterAll(() => server.close())

afterEach(() => {
  server.resetHandlers()
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})
