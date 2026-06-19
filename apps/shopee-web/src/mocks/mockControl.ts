// Runtime mock-control module
// Persists per-feature flags in localStorage under __shopee_mocks__
// and caches them in memory for synchronous request-time reads.

import { http, passthrough } from 'msw'
import type { HttpHandler } from 'msw'

export const MOCK_STORAGE_KEY = '__shopee_mocks__'

/** The 8 canonical endpoint-domain feature keys. */
export const DOMAIN_KEYS = [
  'orders',
  'auth',
  'cart',
  'user',
  'address',
  'notification',
  'wishlist',
  'checkout',
] as const

export type DomainKey = (typeof DOMAIN_KEYS)[number]

type MockState = Record<DomainKey, boolean>

// ---------------------------------------------------------------------------
// In-memory cache — populated once on module init, kept in sync on writes
// ---------------------------------------------------------------------------
let cache: MockState = buildDefault()

function buildDefault(): MockState {
  return DOMAIN_KEYS.reduce<MockState>((acc, key) => {
    acc[key] = false
    return acc
  }, {} as MockState)
}

function loadFromStorage(): MockState {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY)
    if (!raw) return buildDefault()
    const parsed = JSON.parse(raw) as Partial<MockState>
    const state = buildDefault()
    for (const key of DOMAIN_KEYS) {
      if (typeof parsed[key] === 'boolean') {
        state[key] = parsed[key]
      }
    }
    return state
  } catch {
    return buildDefault()
  }
}

function persist(state: MockState): void {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage may be unavailable (e.g. SSR / private browsing / test env)
  }
}

// ---------------------------------------------------------------------------
// Module init — seed from ?mocks= query param, then load persisted state
// ---------------------------------------------------------------------------
;(function init() {
  try {
    const params = new URLSearchParams(window.location.search)
    const mocks = params.get('mocks')
    if (mocks === 'on') {
      const state = buildDefault()
      for (const key of DOMAIN_KEYS) {
        state[key] = true
      }
      persist(state)
      cache = state
      return
    }
    if (mocks === 'off') {
      const state = buildDefault()
      persist(state)
      cache = state
      return
    }
  } catch {
    // window may not be defined in test environments without jsdom
  }
  cache = loadFromStorage()
})()

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns true when the feature mock is currently ON. Synchronous. */
export function isMockEnabled(feature: DomainKey): boolean {
  return cache[feature] === true
}

/** Turns the feature mock ON and persists. */
export function enable(feature: DomainKey): void {
  cache[feature] = true
  persist(cache)
}

/** Turns the feature mock OFF and persists. */
export function disable(feature: DomainKey): void {
  cache[feature] = false
  persist(cache)
}

/** Toggles the feature mock and persists. */
export function toggle(feature: DomainKey): void {
  cache[feature] = !cache[feature]
  persist(cache)
}

/** Returns a snapshot of all feature keys and their current state. */
export function list(): Record<DomainKey, boolean> {
  return { ...cache }
}

/** Disables all feature mocks and persists. */
export function reset(): void {
  cache = buildDefault()
  persist(cache)
}

// ---------------------------------------------------------------------------
// Gated handler helper
// ---------------------------------------------------------------------------

// Internal type: MSW v2 HttpHandler exposes .info and .resolver at runtime.
type MswHandlerInternal = HttpHandler & {
  info: { method: string; path: string }
  resolver: Parameters<typeof http.all>[1]
}

/**
 * Wraps an MSW HttpHandler so it passes through to the real backend when
 * the feature mock is OFF, and delegates to the original resolver when ON.
 *
 * The wrapper re-creates the handler with the same method and path so MSW
 * registration order and path matching are identical to the original.
 *
 * Usage:
 *   export const myRequest = gated('orders', http.get(url, resolver))
 */
export function gated(feature: DomainKey, handler: HttpHandler): HttpHandler {
  const internal = handler as MswHandlerInternal
  const { method, path: handlerPath } = internal.info
  const originalResolver = internal.resolver

  const wrappedResolver: Parameters<typeof http.all>[1] = (args) => {
    if (!isMockEnabled(feature)) {
      return passthrough()
    }
    return originalResolver(args)
  }

  const m = method.toLowerCase() as keyof typeof http
  if (m === 'get') return http.get(handlerPath, wrappedResolver)
  if (m === 'post') return http.post(handlerPath, wrappedResolver)
  if (m === 'put') return http.put(handlerPath, wrappedResolver)
  if (m === 'delete') return http.delete(handlerPath, wrappedResolver)
  if (m === 'patch') return http.patch(handlerPath, wrappedResolver)
  if (m === 'head') return http.head(handlerPath, wrappedResolver)
  return http.all(handlerPath, wrappedResolver)
}

// ---------------------------------------------------------------------------
// Worker-active flag — set to true only after worker.start() resolves
// ---------------------------------------------------------------------------

/** True once the MSW service worker has started inside enableMocking(). */
export let workerActive = false

/** Called from main.tsx after worker.start() resolves. */
export function setWorkerActive(): void {
  workerActive = true
}

/**
 * Returns true when BOTH the MSW worker is running AND the checkout feature
 * mock is ON. This prevents a stale localStorage flag from bypassing the real
 * Stripe call in a build that ships no worker.
 */
export function isCheckoutMockActive(): boolean {
  return workerActive && isMockEnabled('checkout')
}
