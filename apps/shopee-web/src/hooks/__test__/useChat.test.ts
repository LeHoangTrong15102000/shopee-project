import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useChat from '../useChat'
import { SocketEvent } from 'src/types/socket.types'

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}

vi.mock('../useSocket', () => ({
  default: vi.fn(() => ({
    socket: mockSocket,
    isConnected: true,
    emit: mockSocket.emit,
    on: mockSocket.on,
    off: mockSocket.off,
  })),
}))

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial empty state', () => {
    const { result } = renderHook(() => useChat())

    expect(result.current.messages).toEqual([])
    expect(result.current.currentChatId).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isConnected).toBe(true)
  })

  it('should emit JOIN_CHAT event when joinChat is called', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.joinChat('chat-123')
    })

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.JOIN_CHAT, {
      chat_id: 'chat-123',
    })
    expect(result.current.currentChatId).toBe('chat-123')
    expect(result.current.isLoading).toBe(true)
  })

  it('should emit SEND_MESSAGE with payload when sendMessage is called', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.joinChat('chat-123')
    })

    act(() => {
      result.current.sendMessage('Hello world')
    })

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.SEND_MESSAGE, {
      chat_id: 'chat-123',
      message: 'Hello world',
      message_type: 'text',
    })
  })

  it('should not send empty messages', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.joinChat('chat-123')
    })

    const emitCallsBefore = mockSocket.emit.mock.calls.length

    act(() => {
      result.current.sendMessage('   ')
    })

    const emitCallsAfter = mockSocket.emit.mock.calls.length
    expect(emitCallsAfter).toBe(emitCallsBefore)
  })

  it('should emit LEAVE_CHAT and clear state when leaveChat is called', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.joinChat('chat-123')
    })

    act(() => {
      result.current.leaveChat()
    })

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.LEAVE_CHAT, {
      chat_id: 'chat-123',
    })
    expect(result.current.currentChatId).toBeNull()
    expect(result.current.messages).toEqual([])
  })

  it('should register MESSAGE_RECEIVED handler', () => {
    renderHook(() => useChat())

    expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.MESSAGE_RECEIVED, expect.any(Function))
  })

  it('should register MESSAGE_DELIVERED handler', () => {
    renderHook(() => useChat())

    expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.MESSAGE_DELIVERED, expect.any(Function))
  })

  it('should cleanup socket listeners on unmount', () => {
    const { unmount } = renderHook(() => useChat())

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.MESSAGE_RECEIVED, expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.MESSAGE_DELIVERED, expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.USER_JOINED, expect.any(Function))
  })
})
