import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePWAInstall } from '../usePWAInstall'

const mockStorage: Record<string, string> = {}

vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key]
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  }),
})

vi.stubGlobal(
  'matchMedia',
  vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
)

describe('usePWAInstall', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render and return expected shape', () => {
    const { result } = renderHook(() => usePWAInstall())

    expect(result.current).toHaveProperty('isInstallable')
    expect(result.current).toHaveProperty('isInstalled')
    expect(result.current).toHaveProperty('promptInstall')
    expect(result.current).toHaveProperty('dismissPrompt')
    expect(typeof result.current.isInstallable).toBe('boolean')
    expect(typeof result.current.isInstalled).toBe('boolean')
    expect(typeof result.current.promptInstall).toBe('function')
    expect(typeof result.current.dismissPrompt).toBe('function')
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePWAInstall())

    expect(result.current.isInstallable).toBe(false)
  })
})
