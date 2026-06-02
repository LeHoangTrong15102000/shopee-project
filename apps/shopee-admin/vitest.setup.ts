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

// Mock motion/react so motion.div, motion.span etc. render as plain HTML elements
// and AnimatePresence renders children directly — avoids animation timing issues in tests
vi.mock('motion/react', async () => {
  const React = await import('react')
  const createMotionComponent = (tag: string) =>
    React.forwardRef(
      (
        { children, ...props }: React.HTMLAttributes<HTMLElement> & { [key: string]: unknown },
        ref: React.Ref<HTMLElement>,
      ) => {
        // Strip motion-specific props before passing to DOM element
        const {
          initial: _i,
          animate: _a,
          exit: _e,
          transition: _t,
          variants: _v,
          whileHover: _wh,
          whileTap: _wt,
          whileFocus: _wf,
          whileDrag: _wd,
          whileInView: _wiv,
          layout: _l,
          layoutId: _lid,
          onAnimationStart: _oas,
          onAnimationComplete: _oac,
          style: _style,
          ...domProps
        } = props as Record<string, unknown>
        return React.createElement(tag, { ...domProps, ref }, children)
      },
    )
  const componentCache = new Map<string, ReturnType<typeof createMotionComponent>>()
  const motionProxy = new Proxy({} as Record<string, ReturnType<typeof createMotionComponent>>, {
    get: (_target, prop: string) => {
      if (!componentCache.has(prop)) {
        componentCache.set(prop, createMotionComponent(prop))
      }
      return componentCache.get(prop)!
    },
  })

  // Create a mock MotionValue that holds a value and notifies listeners
  const createMotionValue = (initial: unknown) => {
    let _val = initial
    const listeners: Array<(v: unknown) => void> = []
    return {
      get: () => _val,
      set: (v: unknown) => {
        _val = v
        listeners.forEach((fn) => fn(v))
      },
      // jump() instantly sets the value without animation (used by AnimatedNumber)
      jump: (v: unknown) => {
        _val = v
        listeners.forEach((fn) => fn(v))
      },
      on: (_event: string, fn: (v: unknown) => void) => {
        listeners.push(fn)
        return () => {
          const idx = listeners.indexOf(fn)
          if (idx !== -1) listeners.splice(idx, 1)
        }
      },
    }
  }

  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => true,
    useSpring: (value: number) => createMotionValue(value),
    useTransform: (source: { get: () => unknown }, fnOrFrom: unknown, to?: unknown[]) => {
      // Handle both useTransform(mv, fn) and useTransform(mv, [from], [to]) forms
      const fn =
        typeof fnOrFrom === 'function'
          ? (fnOrFrom as (v: unknown) => unknown)
          : (_v: unknown) => (to ? to[to.length - 1] : _v)
      const initial = fn(source.get())
      const mv = createMotionValue(initial)
      // Subscribe to source changes
      if (source && typeof source.on === 'function') {
        source.on('change', (v: unknown) => mv.set(fn(v)))
      }
      return mv
    },
    useMotionValue: (initial: number) => createMotionValue(initial),
    useMotionValueEvent: (_mv: unknown, _event: string, _fn: unknown) => {
      // No-op in tests — AnimatedNumber initializes displayText with the correct value
    },
    MotionConfig: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  }
})

// Mock lottie-react to avoid canvas/animation issues in jsdom
vi.mock('lottie-react', async () => {
  const React = await import('react')
  return {
    default: ({ fallback }: { fallback?: unknown; [key: string]: unknown }) =>
      (fallback as React.ReactElement) ?? null,
  }
})

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
