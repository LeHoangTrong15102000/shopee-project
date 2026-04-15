import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'
import { useKeyboardShortcuts, SHORTCUT_ROUTES } from './use-keyboard-shortcuts'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(MemoryRouter, null, children)
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('navigates to dashboard on Alt+1', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper })
    act(() => {
      const event = new KeyboardEvent('keydown', { key: '1', altKey: true, bubbles: true })
      document.body.dispatchEvent(event)
    })
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('navigates to users on Alt+2', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper })
    act(() => {
      const event = new KeyboardEvent('keydown', { key: '2', altKey: true, bubbles: true })
      document.body.dispatchEvent(event)
    })
    expect(mockNavigate).toHaveBeenCalledWith('/users')
  })

  it('ignores non-Alt keys', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper })
    act(() => {
      const event = new KeyboardEvent('keydown', { key: '1', altKey: false, bubbles: true })
      document.body.dispatchEvent(event)
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('ignores shortcuts in input elements', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper })
    const input = document.createElement('input')
    document.body.appendChild(input)
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: '1', altKey: true, bubbles: true }))
    })
    expect(mockNavigate).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('cleans up event listener on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useKeyboardShortcuts(), { wrapper })
    unmount()
    expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function))
    spy.mockRestore()
  })

  it('exports SHORTCUT_ROUTES', () => {
    expect(SHORTCUT_ROUTES).toHaveLength(9)
    expect(SHORTCUT_ROUTES[0]).toBe('/')
  })
})
