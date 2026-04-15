import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDevicePerformance } from '../useDevicePerformance'

describe('useDevicePerformance', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns expected shape', () => {
    const { result } = renderHook(() => useDevicePerformance())
    expect(result.current).toHaveProperty('isLowEnd')
    expect(result.current).toHaveProperty('shouldReduceAnimations')
    expect(typeof result.current.isLowEnd).toBe('boolean')
  })

  it('shouldReduceAnimations matches isLowEnd', () => {
    const { result } = renderHook(() => useDevicePerformance())
    expect(result.current.isLowEnd).toBe(result.current.shouldReduceAnimations)
  })

  it('detects low-end device with low memory', () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true })
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true })
    const { result } = renderHook(() => useDevicePerformance())
    expect(result.current.isLowEnd).toBe(true)
  })

  it('detects normal device with enough resources', () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true })
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true })
    const { result } = renderHook(() => useDevicePerformance())
    expect(result.current.isLowEnd).toBe(false)
  })

  it('handles missing deviceMemory', () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true })
    const { result } = renderHook(() => useDevicePerformance())
    expect(result.current).toBeDefined()
  })

  it('detects low cores with slow connection', () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true })
    Object.defineProperty(navigator, 'connection', {
      value: { effectiveType: '2g' },
      configurable: true,
    })
    const { result } = renderHook(() => useDevicePerformance())
    expect(result.current.isLowEnd).toBe(true)
  })
})
