import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNavigate } from 'react-router'
import { useNavigation } from '../useNavigation'
import navigationService from 'src/services/navigation.service'

vi.mock('react-router', () => ({
  useNavigate: vi.fn(),
}))

vi.mock('src/services/navigation.service', () => {
  const service = {
    init: vi.fn(),
    to: vi.fn(),
    toLogin: vi.fn(),
    toProduct: vi.fn(),
    toSearch: vi.fn(),
    buildUrl: vi.fn(),
    handlePostLoginRedirect: vi.fn(),
    getPendingRedirect: vi.fn(),
    clearPendingRedirect: vi.fn(),
  }
  return { default: service, PATHS: { HOME: '/', LOGIN: '/login', CART: '/cart' } }
})

describe('useNavigation', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  })

  it('calls navigationService.init with navigate on mount', () => {
    renderHook(() => useNavigation())

    expect(navigationService.init).toHaveBeenCalledWith(mockNavigate)
  })

  it('returns PATHS', () => {
    const { result } = renderHook(() => useNavigation())

    expect(result.current.PATHS).toEqual({
      HOME: '/',
      LOGIN: '/login',
      CART: '/cart',
    })
  })

  it('returns navigation functions', () => {
    const { result } = renderHook(() => useNavigation())

    expect(result.current).toHaveProperty('to')
    expect(result.current).toHaveProperty('toLogin')
    expect(result.current).toHaveProperty('toProduct')
    expect(result.current).toHaveProperty('toSearch')
    expect(result.current).toHaveProperty('buildUrl')
    expect(result.current.navigate).toBe(mockNavigate)
  })
})
