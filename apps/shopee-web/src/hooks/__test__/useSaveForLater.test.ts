import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSaveForLater } from '../useSaveForLater'

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

describe('useSaveForLater', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render and return expected shape', () => {
    const { result } = renderHook(() => useSaveForLater())

    expect(result.current).toHaveProperty('savedItems')
    expect(result.current).toHaveProperty('saveForLater')
    expect(result.current).toHaveProperty('removeFromSaved')
    expect(result.current).toHaveProperty('clearSaved')
    expect(result.current).toHaveProperty('isSaved')
    expect(result.current).toHaveProperty('getSavedItem')
    expect(result.current).toHaveProperty('savedCount')
    expect(Array.isArray(result.current.savedItems)).toBe(true)
    expect(typeof result.current.saveForLater).toBe('function')
    expect(typeof result.current.removeFromSaved).toBe('function')
    expect(typeof result.current.clearSaved).toBe('function')
    expect(typeof result.current.isSaved).toBe('function')
    expect(typeof result.current.getSavedItem).toBe('function')
    expect(typeof result.current.savedCount).toBe('number')
  })

  it('should initialize with empty saved items', () => {
    const { result } = renderHook(() => useSaveForLater())

    expect(result.current.savedItems).toEqual([])
    expect(result.current.savedCount).toBe(0)
  })
})
