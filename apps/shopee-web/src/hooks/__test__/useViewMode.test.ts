import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useViewMode } from '../useViewMode'

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

describe('useViewMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render and return expected shape', () => {
    const { result } = renderHook(() => useViewMode())

    expect(result.current).toHaveProperty('viewMode')
    expect(result.current).toHaveProperty('changeViewMode')
    expect(typeof result.current.viewMode).toBe('string')
    expect(typeof result.current.changeViewMode).toBe('function')
  })

  it('should initialize with grid mode by default', () => {
    const { result } = renderHook(() => useViewMode())

    expect(result.current.viewMode).toBe('grid')
  })
})
