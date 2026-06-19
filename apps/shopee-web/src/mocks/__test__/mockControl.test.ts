import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * mockControl unit tests — task 8.1
 *
 * Each test re-imports mockControl in isolation (vi.resetModules + dynamic import)
 * so the module-init IIFE re-runs with a clean localStorage / window.location state.
 */

describe('mockControl — default-OFF guarantee', () => {
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

  it('all 8 canonical keys are false with empty persisted state', async () => {
    const { DOMAIN_KEYS, isMockEnabled } = await import('../mockControl')

    for (const key of DOMAIN_KEYS) {
      expect(isMockEnabled(key), `Expected ${key} to be OFF by default`).toBe(false)
    }
  })

  it('isMockEnabled returns false for each key individually', async () => {
    const { isMockEnabled } = await import('../mockControl')

    expect(isMockEnabled('orders')).toBe(false)
    expect(isMockEnabled('auth')).toBe(false)
    expect(isMockEnabled('cart')).toBe(false)
    expect(isMockEnabled('user')).toBe(false)
    expect(isMockEnabled('address')).toBe(false)
    expect(isMockEnabled('notification')).toBe(false)
    expect(isMockEnabled('wishlist')).toBe(false)
    expect(isMockEnabled('checkout')).toBe(false)
  })

  it('isCheckoutMockActive() is false because workerActive defaults to false', async () => {
    const { isCheckoutMockActive, workerActive } = await import('../mockControl')

    // workerActive is only set to true by setWorkerActive() called after worker.start()
    // — it must start as false so a stale localStorage flag cannot bypass Stripe in prod
    expect(workerActive).toBe(false)
    expect(isCheckoutMockActive()).toBe(false)
  })

  it('isCheckoutMockActive() remains false even if checkout is enabled but worker is inactive', async () => {
    const mc = await import('../mockControl')

    mc.enable('checkout')
    // workerActive was never set — guard must still return false
    expect(mc.workerActive).toBe(false)
    expect(mc.isCheckoutMockActive()).toBe(false)
  })

  it('isCheckoutMockActive() returns true only after setWorkerActive() AND checkout is ON', async () => {
    const { enable, setWorkerActive, isCheckoutMockActive } = await import('../mockControl')

    // worker active but checkout OFF → still false
    setWorkerActive()
    expect(isCheckoutMockActive()).toBe(false)

    // enable checkout → now true
    enable('checkout')
    expect(isCheckoutMockActive()).toBe(true)
  })

  it('list() returns all keys as false with empty persisted state', async () => {
    const { list, DOMAIN_KEYS } = await import('../mockControl')

    const snapshot = list()
    for (const key of DOMAIN_KEYS) {
      expect(snapshot[key], `Expected list()[${key}] to be false`).toBe(false)
    }
  })

  it('enable() turns a single key ON and persists to localStorage', async () => {
    const { enable, isMockEnabled, MOCK_STORAGE_KEY } = await import('../mockControl')

    enable('orders')
    expect(isMockEnabled('orders')).toBe(true)

    // Other keys must remain OFF
    expect(isMockEnabled('auth')).toBe(false)

    // Must be persisted
    const stored = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) ?? '{}')
    expect(stored.orders).toBe(true)
    expect(stored.auth).toBe(false)
  })

  it('disable() turns a key back OFF after it was enabled', async () => {
    const { enable, disable, isMockEnabled } = await import('../mockControl')

    enable('cart')
    expect(isMockEnabled('cart')).toBe(true)

    disable('cart')
    expect(isMockEnabled('cart')).toBe(false)
  })

  it('toggle() flips a key from OFF to ON and back', async () => {
    const { toggle, isMockEnabled } = await import('../mockControl')

    expect(isMockEnabled('user')).toBe(false)
    toggle('user')
    expect(isMockEnabled('user')).toBe(true)
    toggle('user')
    expect(isMockEnabled('user')).toBe(false)
  })

  it('reset() turns all keys OFF and persists', async () => {
    const { enable, reset, isMockEnabled, DOMAIN_KEYS, MOCK_STORAGE_KEY } =
      await import('../mockControl')

    for (const key of DOMAIN_KEYS) {
      enable(key)
    }
    reset()

    for (const key of DOMAIN_KEYS) {
      expect(isMockEnabled(key), `Expected ${key} to be OFF after reset()`).toBe(false)
    }

    const stored = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) ?? '{}')
    for (const key of DOMAIN_KEYS) {
      expect(stored[key]).toBe(false)
    }
  })

  it('loads persisted ON state from localStorage on module init', async () => {
    // Pre-seed localStorage before import so the IIFE picks it up
    localStorage.setItem(
      '__shopee_mocks__',
      JSON.stringify({
        orders: true,
        auth: false,
        cart: false,
        user: false,
        address: false,
        notification: false,
        wishlist: false,
        checkout: false,
      }),
    )

    const { isMockEnabled } = await import('../mockControl')

    expect(isMockEnabled('orders')).toBe(true)
    expect(isMockEnabled('auth')).toBe(false)
  })

  it('seeds all keys ON when ?mocks=on query param is present', async () => {
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
    // Pre-seed localStorage with all ON to confirm ?mocks=off overrides it
    localStorage.setItem(
      '__shopee_mocks__',
      JSON.stringify({
        orders: true,
        auth: true,
        cart: true,
        user: true,
        address: true,
        notification: true,
        wishlist: true,
        checkout: true,
      }),
    )
    // Same prototype spy approach
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
