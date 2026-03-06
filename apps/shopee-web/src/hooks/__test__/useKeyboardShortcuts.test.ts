import { renderHook } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useKeyboardShortcuts, Shortcut, SequenceShortcut } from '../useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  let mockAction: () => void

  beforeEach(() => {
    mockAction = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const dispatchKeydown = (key: string, options: Partial<KeyboardEventInit> = {}) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }))
  }

  it('calls action when shortcut key is pressed', () => {
    const shortcuts: Shortcut[] = [{ key: '/', description: 'Search', action: mockAction, category: 'Navigation' }]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    dispatchKeydown('/')
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('does not call action when disabled', () => {
    const shortcuts: Shortcut[] = [{ key: '/', description: 'Search', action: mockAction, category: 'Navigation' }]

    renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: false }))

    dispatchKeydown('/')
    expect(mockAction).not.toHaveBeenCalled()
  })

  it('handles Ctrl+key shortcuts', () => {
    const shortcuts: Shortcut[] = [
      { key: 'k', ctrlKey: true, description: 'Command', action: mockAction, category: 'Navigation' }
    ]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    dispatchKeydown('k')
    expect(mockAction).not.toHaveBeenCalled()

    dispatchKeydown('k', { ctrlKey: true })
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('skips shortcuts when typing in input fields', () => {
    const shortcuts: Shortcut[] = [{ key: '/', description: 'Search', action: mockAction, category: 'Navigation' }]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    dispatchKeydown('/')
    expect(mockAction).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('always allows Escape even in input fields', () => {
    const shortcuts: Shortcut[] = [{ key: 'Escape', description: 'Close', action: mockAction, category: 'Navigation' }]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    dispatchKeydown('Escape')
    expect(mockAction).toHaveBeenCalledTimes(1)

    document.body.removeChild(input)
  })

  it('handles sequence shortcuts (e.g., g then h)', () => {
    vi.useFakeTimers()

    const sequenceShortcuts: SequenceShortcut[] = [
      { sequence: ['g', 'h'], description: 'Go Home', action: mockAction, category: 'Navigation' }
    ]

    renderHook(() => useKeyboardShortcuts({ shortcuts: [], sequenceShortcuts }))

    dispatchKeydown('g')
    expect(mockAction).not.toHaveBeenCalled()

    dispatchKeydown('h')
    expect(mockAction).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('cleans up event listeners on unmount', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const shortcuts: Shortcut[] = [{ key: '/', description: 'Search', action: mockAction, category: 'Navigation' }]

    const { unmount } = renderHook(() => useKeyboardShortcuts({ shortcuts }))

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true)
  })
})
