import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useTypingIndicator from '../useTypingIndicator'

const mockEmit = vi.fn()
const mockSocketOn = vi.fn()
const mockSocketOff = vi.fn()

const mockSocket = {
  on: mockSocketOn,
  off: mockSocketOff,
}

vi.mock('../useSocket', () => ({
  default: vi.fn(() => ({
    socket: mockSocket,
    emit: mockEmit,
    isConnected: true,
  })),
}))

describe('useTypingIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns expected shape', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    expect(result.current.typingUsers).toEqual([])
    expect(result.current.isAnyoneTyping).toBe(false)
    expect(typeof result.current.startTyping).toBe('function')
    expect(typeof result.current.stopTyping).toBe('function')
  })

  it('subscribes to socket events on mount', () => {
    renderHook(() => useTypingIndicator('chat-123'))
    expect(mockSocketOn).toHaveBeenCalledWith('user_typing', expect.any(Function))
    expect(mockSocketOn).toHaveBeenCalledWith('user_stopped_typing', expect.any(Function))
  })

  it('unsubscribes from socket events on unmount', () => {
    const { unmount } = renderHook(() => useTypingIndicator('chat-123'))
    unmount()
    expect(mockSocketOff).toHaveBeenCalledWith('user_typing', expect.any(Function))
    expect(mockSocketOff).toHaveBeenCalledWith('user_stopped_typing', expect.any(Function))
  })

  it('emits typing_start when startTyping is called', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    act(() => {
      result.current.startTyping()
    })
    expect(mockEmit).toHaveBeenCalledWith('typing_start', { chat_id: 'chat-123' })
  })

  it('does not emit typing_start if already typing', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    act(() => {
      result.current.startTyping()
    })
    act(() => {
      result.current.startTyping()
    })
    expect(mockEmit).toHaveBeenCalledTimes(1)
  })

  it('emits typing_stop when stopTyping is called after startTyping', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    act(() => {
      result.current.startTyping()
    })
    act(() => {
      result.current.stopTyping()
    })
    expect(mockEmit).toHaveBeenCalledWith('typing_stop', { chat_id: 'chat-123' })
  })

  it('does not emit typing_stop if not typing', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    act(() => {
      result.current.stopTyping()
    })
    expect(mockEmit).not.toHaveBeenCalledWith('typing_stop', expect.anything())
  })

  it('does not emit when chatId is null', () => {
    const { result } = renderHook(() => useTypingIndicator(null))
    act(() => {
      result.current.startTyping()
    })
    act(() => {
      result.current.stopTyping()
    })
    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('adds typing user when user_typing event received', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    const handler = mockSocketOn.mock.calls.find((c) => c[0] === 'user_typing')?.[1]

    act(() => {
      handler({ chat_id: 'chat-123', user_id: 'user-1', user_name: 'Alice' })
    })

    expect(result.current.typingUsers).toHaveLength(1)
    expect(result.current.typingUsers[0].user_name).toBe('Alice')
    expect(result.current.isAnyoneTyping).toBe(true)
  })

  it('ignores typing events for different chat', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    const handler = mockSocketOn.mock.calls.find((c) => c[0] === 'user_typing')?.[1]

    act(() => {
      handler({ chat_id: 'chat-999', user_id: 'user-1', user_name: 'Alice' })
    })

    expect(result.current.typingUsers).toHaveLength(0)
  })

  it('removes typing user when user_stopped_typing event received', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    const typingHandler = mockSocketOn.mock.calls.find((c) => c[0] === 'user_typing')?.[1]
    const stoppedHandler = mockSocketOn.mock.calls.find((c) => c[0] === 'user_stopped_typing')?.[1]

    act(() => {
      typingHandler({ chat_id: 'chat-123', user_id: 'user-1', user_name: 'Alice' })
    })
    expect(result.current.typingUsers).toHaveLength(1)

    act(() => {
      stoppedHandler({ chat_id: 'chat-123', user_id: 'user-1', user_name: 'Alice' })
    })
    expect(result.current.typingUsers).toHaveLength(0)
    expect(result.current.isAnyoneTyping).toBe(false)
  })

  it('auto-removes typing user after timeout', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    const handler = mockSocketOn.mock.calls.find((c) => c[0] === 'user_typing')?.[1]

    act(() => {
      handler({ chat_id: 'chat-123', user_id: 'user-1', user_name: 'Alice' })
    })
    expect(result.current.typingUsers).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.typingUsers).toHaveLength(0)
  })

  it('resets typing timeout when same user types again', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    const handler = mockSocketOn.mock.calls.find((c) => c[0] === 'user_typing')?.[1]

    act(() => {
      handler({ chat_id: 'chat-123', user_id: 'user-1', user_name: 'Alice' })
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.typingUsers).toHaveLength(1)

    // User types again, resetting timeout
    act(() => {
      handler({ chat_id: 'chat-123', user_id: 'user-1', user_name: 'Alice' })
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.typingUsers).toHaveLength(1) // Still there

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.typingUsers).toHaveLength(0) // Now gone
  })

  it('clears typing users when chatId changes', () => {
    const { result, rerender } = renderHook(({ chatId }) => useTypingIndicator(chatId), {
      initialProps: { chatId: 'chat-123' as string | null },
    })

    const handler = mockSocketOn.mock.calls.find((c) => c[0] === 'user_typing')?.[1]
    act(() => {
      handler({ chat_id: 'chat-123', user_id: 'user-1', user_name: 'Alice' })
    })

    rerender({ chatId: 'chat-456' })
    expect(result.current.typingUsers).toHaveLength(0)
  })

  it('ignores stopped_typing for different chat', () => {
    const { result } = renderHook(() => useTypingIndicator('chat-123'))
    const typingHandler = mockSocketOn.mock.calls.find((c) => c[0] === 'user_typing')?.[1]
    const stoppedHandler = mockSocketOn.mock.calls.find((c) => c[0] === 'user_stopped_typing')?.[1]

    act(() => {
      typingHandler({ chat_id: 'chat-123', user_id: 'user-1', user_name: 'Alice' })
    })

    act(() => {
      stoppedHandler({ chat_id: 'chat-999', user_id: 'user-1', user_name: 'Alice' })
    })

    expect(result.current.typingUsers).toHaveLength(1)
  })
})
