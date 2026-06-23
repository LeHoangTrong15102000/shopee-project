/// <reference types="vitest" />

import React from 'react'
import { afterAll, afterEach, beforeAll, expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'

// Import all Vietnamese translations for i18n mock
import addressVi from './src/locales/vi/address.json'
import authVi from './src/locales/vi/auth.json'
import cartVi from './src/locales/vi/cart.json'
import chatVi from './src/locales/vi/chat.json'
import checkinVi from './src/locales/vi/checkin.json'
import checkoutVi from './src/locales/vi/checkout.json'
import commonVi from './src/locales/vi/common.json'
import compareVi from './src/locales/vi/compare.json'
import homeVi from './src/locales/vi/home.json'
import navVi from './src/locales/vi/nav.json'
import notificationVi from './src/locales/vi/notification.json'
import orderVi from './src/locales/vi/order.json'
import paymentVi from './src/locales/vi/payment.json'
import productVi from './src/locales/vi/product.json'
import qaVi from './src/locales/vi/qa.json'
import shippingVi from './src/locales/vi/shipping.json'
import userVi from './src/locales/vi/user.json'
import validationVi from './src/locales/vi/validation.json'
import wishlistVi from './src/locales/vi/wishlist.json'

const allTranslations = {
  address: addressVi,
  auth: authVi,
  cart: cartVi,
  chat: chatVi,
  checkin: checkinVi,
  checkout: checkoutVi,
  common: commonVi,
  compare: compareVi,
  home: homeVi,
  nav: navVi,
  notification: notificationVi,
  order: orderVi,
  payment: paymentVi,
  product: productVi,
  qa: qaVi,
  shipping: shippingVi,
  user: userVi,
  validation: validationVi,
  wishlist: wishlistVi,
}

// Suppress SSL/TLS errors from socket cleanup in CI
// These are benign errors from socket.io-client cleanup during test teardown
process.on('unhandledRejection', (reason) => {
  if (reason && typeof reason === 'object' && 'code' in reason && reason.code === 'ECANCELED') {
    // Suppress ECANCELED errors from SSL socket cleanup
    return
  }
})

import authRequests from './src/msw/auth.msw'
import productRequests from './src/msw/product.msw'
import userRequests from './src/msw/user.msw'
import cartRequests from './src/msw/cart.msw'
import checkoutRequests from './src/msw/checkout.msw'
import orderRequests from './src/msw/order.msw'
import wishlistRequests from './src/msw/wishlist.msw'
import notificationRequests from './src/msw/notification.msw'
import addressRequests from './src/msw/address.msw'
import { setupServer } from 'msw/node'

// Simple localStorage mock implementation
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value?.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

// Setup localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

// Setup sessionStorage mock — separate instance with its own store
const sessionStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value?.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
})

// Mock window.matchMedia (required by useReducedMotion hook)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query) => ({
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
  configurable: true,
})

// Mock IntersectionObserver (required by framer-motion viewport features)
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
  }
  observe() {
    return null
  }
  unobserve() {
    return null
  }
  disconnect() {
    return null
  }
  takeRecords() {
    return []
  }
}

// Additional mock APIs for categories and other endpoints
const additionalMocks = [
  http.get('https://api-ecom.duthanhduoc.com/categories', () => {
    return HttpResponse.json({
      message: 'Lấy categories thành công',
      data: [
        { _id: '1', name: 'Điện thoại' },
        { _id: '2', name: 'Laptop' },
      ],
    })
  }),
  http.options('https://api-ecom.duthanhduoc.com/categories', () => {
    return new HttpResponse(null, { status: 200 })
  }),
]

// Mock framer-motion globally — Proxy-based to handle any motion.xxx element
vi.mock('framer-motion', () => {
  // Props that framer-motion uses but should NOT be passed to DOM elements
  const motionProps = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'variants',
    'whileHover',
    'whileTap',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'drag',
    'dragConstraints',
    'dragElastic',
    'dragMomentum',
    'dragTransition',
    'dragSnapToOrigin',
    'dragPropagation',
    'onDragStart',
    'onDrag',
    'onDragEnd',
    'layout',
    'layoutId',
    'layoutDependency',
    'layoutScroll',
    'viewport',
    'onViewportEnter',
    'onViewportLeave',
    'onAnimationStart',
    'onAnimationComplete',
    'custom',
    'inherit',
    'mode',
    'animated',
  ])

  const componentCache = new Map()

  const createMotionComponent = (tag) => {
    if (componentCache.has(tag)) return componentCache.get(tag)
    const Component = ({ children, ...props }) => {
      const domProps = Object.fromEntries(
        Object.entries(props).filter(([key]) => !motionProps.has(key)),
      )
      const Tag = tag
      return React.createElement(Tag, domProps, children)
    }
    Component.displayName = `motion.${tag}`
    componentCache.set(tag, Component)
    return Component
  }

  const motion = new Proxy(
    {},
    {
      get: (_, tag) => createMotionComponent(tag),
    },
  )

  return {
    motion,
    AnimatePresence: ({ children }) => children,
    useReducedMotion: () => false,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
    useMotionValue: (initial) => ({ get: () => initial, set: vi.fn(), onChange: vi.fn() }),
    useTransform: () => ({ get: () => 0, set: vi.fn() }),
    useSpring: () => ({ get: () => 0, set: vi.fn() }),
    useInView: () => true,
    useScroll: () => ({
      scrollY: { get: () => 0, onChange: vi.fn() },
      scrollYProgress: { get: () => 0, onChange: vi.fn() },
    }),
    LayoutGroup: ({ children }) => children,
    LazyMotion: ({ children }) => children,
    domAnimation: {},
    m: motion,
  }
})

// Mock react-i18next
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next')
  return {
    ...actual,
    useTranslation: (ns = 'home') => ({
      t: (key, options) => {
        const namespaces = typeof ns === 'string' ? [ns] : Array.isArray(ns) ? ns : ['home']

        // Handle namespace-prefixed keys (e.g., 'order:preview.backButton')
        let searchKey = key
        let searchNamespaces = namespaces
        if (typeof key === 'string' && key.includes(':')) {
          const colonIdx = key.indexOf(':')
          const nsPrefix = key.slice(0, colonIdx)
          searchKey = key.slice(colonIdx + 1)
          searchNamespaces = [nsPrefix]
        }

        // Search through namespaces for the key
        for (const namespace of searchNamespaces) {
          const translations = allTranslations[namespace]
          if (translations?.[searchKey]) {
            let value = translations[searchKey]
            // Handle interpolation: replace {{variable}} with actual values
            if (options && typeof value === 'string') {
              Object.keys(options).forEach((optKey) => {
                if (optKey !== 'defaultValue') {
                  value = value.replace(
                    new RegExp(`\\{\\{${optKey}\\}\\}`, 'g'),
                    String(options[optKey]),
                  )
                }
              })
            }
            return value
          }
        }

        // Fall back to defaultValue, then key
        if (options?.defaultValue) return options.defaultValue
        return key
      },
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
    Trans: ({ children }) => children,
  }
})

const server = setupServer(
  ...authRequests,
  ...productRequests,
  ...userRequests,
  ...cartRequests,
  ...checkoutRequests,
  ...orderRequests,
  ...wishlistRequests,
  ...notificationRequests,
  ...addressRequests,
  ...additionalMocks,
)

// Expose the server globally so individual test files can call server.use()
// to override handlers for specific scenarios without creating a second server.
globalThis.__mswServer = server

// Start server before all tests — unhandled requests sẽ log warning (không throw để tránh phá teardown)
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test `important for test isolation`
afterEach(() => {
  server.resetHandlers()
  cleanup()
  // Clear localStorage after each test
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// Mock PointerEvent cho framer-motion trong test environment
global.PointerEvent = class PointerEvent extends Event {
  constructor(type, options = {}) {
    super(type, options)
    this.pointerId = options.pointerId || 1
    this.clientX = options.clientX || 0
    this.clientY = options.clientY || 0
    this.pointerType = options.pointerType || 'mouse'
    this.pressure = options.pressure || 0.5
    this.isPrimary = options.isPrimary || true
  }
}

// Mock additional globals for test environment
Object.defineProperty(window, 'HTMLElement', {
  value: HTMLElement,
  configurable: true,
})

// Mock @heroui/tooltip to avoid @react-aria/interactions crash in jsdom
// (@react-aria tries to set HTMLElement.focus which is read-only in jsdom)
vi.mock('@heroui/tooltip', () => ({
  Tooltip: ({ children }) => children,
}))

// Mock react-toastify to prevent timer leaks from toast.error/success autoClose
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
  ToastContainer: () => null,
  Bounce: 'Bounce',
}))

// Mock heavy lazy-loaded components to prevent OOM in integration tests
// These are only used in App.tsx via React.lazy() - component tests import directly and override
vi.mock('src/components/ChatbotWidget', () => ({
  default: () => null,
}))

vi.mock('src/components/PWAInstallPrompt', () => ({
  default: () => null,
}))

// Mock nuqs hooks globally to prevent "nuqs requires an adapter" errors
// Tests that need real nuqs behavior use NuqsTestingAdapter from testUtils.tsx
vi.mock('src/hooks/nuqs', () => ({
  useProductQueryStates: () => [
    {
      page: 1,
      limit: 20,
      sort_by: 'createdAt',
      order: 'desc',
      exclude: '',
      name: '',
      price_min: '',
      price_max: '',
      rating_filter: '',
      category: '',
    },
    vi.fn(),
  ],
  usePurchaseStatus: () => [0, vi.fn()],
  useOrderStatus: () => [0, vi.fn()],
  productSearchParsers: {},
  createProductSearchURL: () => '',
  normalizeProductQueryKey: (key) => key,
}))

// Note: window.location.replace is handled by http.ts which uses pushState in test mode
