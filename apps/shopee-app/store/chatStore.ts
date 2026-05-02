import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'
import { Message } from '@/types/chat.type'
import { useAuthStore } from './authStore'
import { API_BASE_URL } from '@/config/env'

// Derive WebSocket URL from API base URL
const WS_URL = API_BASE_URL.replace(/\/$/, '')

const BACKOFF_BASE = 1000
const BACKOFF_MAX = 30000
const BACKOFF_JITTER = 1000

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

// Socket is kept outside Zustand state to avoid storing non-serializable objects in the store
let socket: Socket | null = null

interface ChatState {
  status: ConnectionStatus
  // In-memory buffer: conversationId -> messages received via socket
  messageBuffer: Record<string, Message[]>
  // Typing state: conversationId -> boolean
  typingState: Record<string, boolean>
  retryCount: number
  // Timestamp updated on each successful reconnect so screens can re-fetch
  lastReconnectedAt: number | null

  connect: () => void
  disconnect: () => void
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  sendTyping: (conversationId: string) => void
  markRead: (conversationId: string) => void
  appendToBuffer: (conversationId: string, message: Message) => void
  clearBuffer: (conversationId: string) => void
  setTyping: (conversationId: string, isTyping: boolean) => void
}

function getBackoffDelay(retryCount: number): number {
  const exponential = Math.min(BACKOFF_BASE * Math.pow(2, retryCount), BACKOFF_MAX)
  const jitter = Math.random() * BACKOFF_JITTER
  return exponential + jitter
}

export const useChatStore = create<ChatState>((set, get) => ({
  status: 'disconnected',
  messageBuffer: {},
  typingState: {},
  retryCount: 0,
  lastReconnectedAt: null,

  connect: () => {
    const { status } = get()
    if (socket && (status === 'connected' || status === 'connecting')) return

    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) return

    set({ status: 'connecting' })

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function scheduleReconnect() {
      if (reconnectTimer) return
      const retryCount = useChatStore.getState().retryCount
      const delay = getBackoffDelay(retryCount)
      useChatStore.setState({ retryCount: retryCount + 1 })

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        if (socket) {
          socket.disconnect()
          socket = null
        }
        useChatStore.getState().connect()
      }, delay)
    }

    const newSocket = io(WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: false, // We handle reconnection manually
    })

    newSocket.on('connect', () => {
      const wasReconnecting = get().status === 'reconnecting'
      set({
        status: 'connected',
        retryCount: 0,
        lastReconnectedAt: wasReconnecting ? Date.now() : get().lastReconnectedAt,
      })
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    })

    newSocket.on('disconnect', () => {
      set({ status: 'reconnecting' })
      scheduleReconnect()
    })

    newSocket.on('connect_error', () => {
      set({ status: 'reconnecting' })
      scheduleReconnect()
    })

    newSocket.on('message:new', (message: Message) => {
      get().appendToBuffer(message.conversationId, message)
    })

    newSocket.on('typing', ({ conversationId }: { conversationId: string }) => {
      get().setTyping(conversationId, true)
      setTimeout(() => get().setTyping(conversationId, false), 3000)
    })

    socket = newSocket
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
    set({ status: 'disconnected', retryCount: 0 })
  },

  joinConversation: (conversationId) => {
    socket?.emit('shop_chat:join', { conversationId })
  },

  leaveConversation: (conversationId) => {
    socket?.emit('shop_chat:leave', { conversationId })
  },

  sendTyping: (conversationId) => {
    socket?.emit('typing', { conversationId })
  },

  markRead: (conversationId) => {
    socket?.emit('message:read', { conversationId })
  },

  appendToBuffer: (conversationId, message) => {
    set((state) => {
      const existing = state.messageBuffer[conversationId] ?? []
      // Deduplicate by _id
      if (existing.some((m) => m._id === message._id)) return state
      return {
        messageBuffer: {
          ...state.messageBuffer,
          [conversationId]: [...existing, message],
        },
      }
    })
  },

  clearBuffer: (conversationId) => {
    set((state) => {
      const { [conversationId]: _, ...rest } = state.messageBuffer
      return { messageBuffer: rest }
    })
  },

  setTyping: (conversationId, isTyping) => {
    set((state) => ({
      typingState: { ...state.typingState, [conversationId]: isTyping },
    }))
  },
}))
