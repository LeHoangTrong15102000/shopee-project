import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFocusTrap } from '../useFocusTrap'
import { useRef } from 'react'

describe('useFocusTrap', () => {
  it('should render without error', () => {
    const { result: containerRef } = renderHook(() => useRef<HTMLDivElement>(null))

    const { result } = renderHook(() =>
      useFocusTrap({
        isOpen: false,
        containerRef: containerRef.current,
        onClose: vi.fn(),
      }),
    )

    expect(result.current).toBeUndefined()
  })

  it('should handle isOpen true', () => {
    const { result: containerRef } = renderHook(() => useRef<HTMLDivElement>(null))

    const { result } = renderHook(() =>
      useFocusTrap({
        isOpen: true,
        containerRef: containerRef.current,
      }),
    )

    expect(result.current).toBeUndefined()
  })
})
