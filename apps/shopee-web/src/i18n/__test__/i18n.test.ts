import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock i18next before importing
vi.mock('i18next', () => {
  const bundles: Record<string, Record<string, any>> = {}
  return {
    default: {
      use: vi.fn().mockReturnThis(),
      init: vi.fn().mockResolvedValue(undefined),
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      addResourceBundle: vi.fn((lng, ns, bundle) => {
        if (!bundles[lng]) bundles[lng] = {}
        bundles[lng][ns] = bundle
      }),
      hasResourceBundle: vi.fn((lng, ns) => {
        return bundles[lng]?.[ns] !== undefined
      }),
    },
  }
})

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Mock all locale imports
const mockJson = { key: 'value' }
vi.mock('src/locales/vi/common.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/home.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/product.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/nav.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/auth.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/cart.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/user.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/payment.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/notification.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/chat.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/order.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/checkout.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/address.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/qa.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/shipping.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/checkin.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/wishlist.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/compare.json', () => ({ default: mockJson }))
vi.mock('src/locales/vi/validation.json', () => ({ default: mockJson }))

describe('i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('exports locales', async () => {
    const { locales } = await import('../i18n')
    expect(locales.vi).toBe('Tiếng Việt')
    expect(locales.en).toBe('English')
  })

  it('exports resources with vi namespace', async () => {
    const { resources } = await import('../i18n')
    expect(resources.vi).toBeDefined()
    expect(resources.vi.common).toBeDefined()
    expect(resources.vi.home).toBeDefined()
  })

  it('exports defaultNS as home', async () => {
    const { defaultNS } = await import('../i18n')
    expect(defaultNS).toBe('home')
  })

  it('loadLanguage switches to vi', async () => {
    const { loadLanguage } = await import('../i18n')
    const i18n = (await import('i18next')).default
    await loadLanguage('vi')
    expect(i18n.changeLanguage).toHaveBeenCalledWith('vi')
    expect(document.documentElement.lang).toBe('vi')
    expect(localStorage.getItem('lng')).toBe('vi')
  })

  it('loadLanguage loads en resources when not cached', async () => {
    const { loadLanguage } = await import('../i18n')
    const i18n = (await import('i18next')).default
    vi.mocked(i18n.hasResourceBundle).mockReturnValue(false)
    await loadLanguage('en')
    expect(i18n.addResourceBundle).toHaveBeenCalled()
    expect(i18n.changeLanguage).toHaveBeenCalledWith('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('loadLanguage uses cached en resources', async () => {
    const { loadLanguage } = await import('../i18n')
    const i18n = (await import('i18next')).default
    vi.mocked(i18n.hasResourceBundle).mockReturnValue(true)
    vi.mocked(i18n.addResourceBundle).mockClear()
    await loadLanguage('en')
    expect(i18n.addResourceBundle).not.toHaveBeenCalled()
    expect(i18n.changeLanguage).toHaveBeenCalledWith('en')
  })

  it('loadLanguage handles localStorage error gracefully', async () => {
    const { loadLanguage } = await import('../i18n')
    const originalSetItem = localStorage.setItem
    localStorage.setItem = vi.fn(() => {
      throw new Error('quota exceeded')
    })
    await loadLanguage('vi')
    // Should not throw
    localStorage.setItem = originalSetItem
  })
})
