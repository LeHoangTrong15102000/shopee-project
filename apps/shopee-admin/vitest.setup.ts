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

// Polyfill PointerEvent for jsdom (used by @base-ui checkbox)
if (typeof globalThis.PointerEvent === 'undefined') {
  // @ts-expect-error minimal polyfill
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    readonly pointerId: number
    readonly width: number
    readonly height: number
    readonly pressure: number
    readonly tiltX: number
    readonly tiltY: number
    readonly pointerType: string
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
      this.width = params.width ?? 1
      this.height = params.height ?? 1
      this.pressure = params.pressure ?? 0
      this.tiltX = params.tiltX ?? 0
      this.tiltY = params.tiltY ?? 0
      this.pointerType = params.pointerType ?? ''
    }
  }
}

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

// Mock virtualizer so DataTable renders all rows in jsdom (no real scroll container)
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        start: i * 48,
        end: (i + 1) * 48,
        size: 48,
        key: i,
      })),
    getTotalSize: () => count * 48,
    measureElement: () => {},
  }),
}))

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
