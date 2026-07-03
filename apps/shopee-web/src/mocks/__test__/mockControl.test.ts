import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * mockControl unit tests — task 8.1
 *
 * Each test re-imports mockControl in isolation (vi.resetModules + dynamic import)
 * so the module-init IIFE re-runs with a clean localStorage / window.location state.
 *
 * Contract: mocks are ON by default. mockControl is only imported from
 * enableMocking() (main.tsx), which runs only in dev or when
 * VITE_ENABLE_MOCKS === 'true' — so loading the module already means
 * "mocks are wanted". reset() and ?mocks=off are the OFF escape hatches.
 */

describe('mockControl — default-ON guarantee', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    localStorage.clear()
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('all 8 canonical keys are true with empty persisted state', async () => {
    const { DOMAIN_KEYS, isMockEnabled } = await import('../mockControl')

    for (const key of DOMAIN_KEYS) {
      expect(isMockEnabled(key), `Expected ${key} to be ON by default`).toBe(true)
    }
  })

  it('isMockEnabled returns true for each key individually', async () => {
    const { isMockEnabled } = await import('../mockControl')

    expect(isMockEnabled('orders')).toBe(true)
    expect(isMockEnabled('auth')).toBe(true)
    expect(isMockEnabled('cart')).toBe(true)
    expect(isMockEnabled('user')).toBe(true)
    expect(isMockEnabled('address')).toBe(true)
    expect(isMockEnabled('notification')).toBe(true)
    expect(isMockEnabled('wishlist')).toBe(true)
    expect(isMockEnabled('checkout')).toBe(true)
  })

  it('isCheckoutMockActive() is false because workerActive defaults to false', async () => {
    const { isCheckoutMockActive, workerActive } = await import('../mockControl')

    // checkout defaults ON, but workerActive is only set to true by
    // setWorkerActive() called after worker.start() — it must start as false so a
    // stale flag cannot bypass Stripe in a build that ships no worker.
    expect(workerActive).toBe(false)
    expect(isCheckoutMockActive()).toBe(false)
  })

  it('isCheckoutMockActive() remains false while worker is inactive even though checkout is ON', async () => {
    const mc = await import('../mockControl')

    expect(mc.isMockEnabled('checkout')).toBe(true)
    // workerActive was never set — guard must still return false
    expect(mc.workerActive).toBe(false)
    expect(mc.isCheckoutMockActive()).toBe(false)
  })

  it('isCheckoutMockActive() returns true once setWorkerActive() runs and checkout is ON', async () => {
    const { disable, enable, setWorkerActive, isCheckoutMockActive } =
      await import('../mockControl')

    // checkout OFF + worker active → false
    disable('checkout')
    setWorkerActive()
    expect(isCheckoutMockActive()).toBe(false)

    // re-enable checkout → now true
    enable('checkout')
    expect(isCheckoutMockActive()).toBe(true)
  })

  it('list() returns all keys as true with empty persisted state', async () => {
    const { list, DOMAIN_KEYS } = await import('../mockControl')

    const snapshot = list()
    for (const key of DOMAIN_KEYS) {
      expect(snapshot[key], `Expected list()[${key}] to be true`).toBe(true)
    }
  })

  it('disable() turns a single key OFF and persists to localStorage', async () => {
    const { disable, isMockEnabled, MOCK_STORAGE_KEY } = await import('../mockControl')

    disable('orders')
    expect(isMockEnabled('orders')).toBe(false)

    // Other keys must remain ON
    expect(isMockEnabled('auth')).toBe(true)

    // Must be persisted
    const stored = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) ?? '{}')
    expect(stored.orders).toBe(false)
    expect(stored.auth).toBe(true)
  })

  it('enable() turns a key back ON after it was disabled', async () => {
    const { enable, disable, isMockEnabled } = await import('../mockControl')

    disable('cart')
    expect(isMockEnabled('cart')).toBe(false)

    enable('cart')
    expect(isMockEnabled('cart')).toBe(true)
  })

  it('toggle() flips a key from ON to OFF and back', async () => {
    const { toggle, isMockEnabled } = await import('../mockControl')

    expect(isMockEnabled('user')).toBe(true)
    toggle('user')
    expect(isMockEnabled('user')).toBe(false)
    toggle('user')
    expect(isMockEnabled('user')).toBe(true)
  })

  it('reset() restores all keys to the enabled default (ON) and persists', async () => {
    const { reset, disable, isMockEnabled, DOMAIN_KEYS, MOCK_STORAGE_KEY } =
      await import('../mockControl')

    // Disable a few keys to confirm reset restores them
    disable('orders')
    disable('cart')
    expect(isMockEnabled('orders')).toBe(false)

    reset()

    for (const key of DOMAIN_KEYS) {
      expect(isMockEnabled(key), `Expected ${key} to be ON after reset()`).toBe(true)
    }

    const stored = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) ?? '{}')
    for (const key of DOMAIN_KEYS) {
      expect(stored[key]).toBe(true)
    }
  })

  it('loads persisted OFF state from localStorage on module init', async () => {
    // Pre-seed localStorage before import so the IIFE picks it up
    localStorage.setItem(
      '__shopee_mocks__',
      JSON.stringify({
        orders: false,
        auth: true,
        cart: true,
        user: true,
        address: true,
        notification: true,
        wishlist: true,
        checkout: true,
      }),
    )

    const { isMockEnabled } = await import('../mockControl')

    expect(isMockEnabled('orders')).toBe(false)
    expect(isMockEnabled('auth')).toBe(true)
  })

  it('seeds all keys ON when ?mocks=on query param is present', async () => {
    // Pre-seed localStorage with all OFF to confirm ?mocks=on overrides it
    localStorage.setItem(
      '__shopee_mocks__',
      JSON.stringify({
        orders: false,
        auth: false,
        cart: false,
        user: false,
        address: false,
        notification: false,
        wishlist: false,
        checkout: false,
      }),
    )
    // Spy on window.location.search via the URLSearchParams constructor.
    // The module's IIFE calls `new URLSearchParams(window.location.search)` at import
    // time. We spy on the prototype's `get` method so the spy is in place for the
    // dynamically imported module regardless of VM context.
    const getSpy = vi.spyOn(URLSearchParams.prototype, 'get').mockImplementation((key: string) => {
      if (key === 'mocks') return 'on'
      return null
    })

    try {
      const { isMockEnabled, DOMAIN_KEYS } = await import('../mockControl')
      for (const key of DOMAIN_KEYS) {
        expect(isMockEnabled(key), `Expected ${key} to be ON with ?mocks=on`).toBe(true)
      }
    } finally {
      getSpy.mockRestore()
    }
  })

  it('seeds all keys OFF when ?mocks=off query param is present', async () => {
    // Same prototype spy approach — overrides the default-ON state
    const getSpy = vi.spyOn(URLSearchParams.prototype, 'get').mockImplementation((key: string) => {
      if (key === 'mocks') return 'off'
      return null
    })

    try {
      const { isMockEnabled, DOMAIN_KEYS } = await import('../mockControl')
      for (const key of DOMAIN_KEYS) {
        expect(isMockEnabled(key), `Expected ${key} to be OFF with ?mocks=off`).toBe(false)
      }
    } finally {
      getSpy.mockRestore()
    }
  })
})
