import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000'

type EventCallback<T = unknown> = (data: T) => void

class SocketClient {
  private socket: Socket | null = null
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private currentToken: string = ''
  private tokenRefresher: (() => Promise<string | null>) | null = null
  private refreshAttemptedForToken: string = ''

  connect(token: string): void {
    // Already connected with the same token — nothing to do
    if (this.socket?.connected && this.currentToken === token) return

    // If a socket instance exists (e.g. stuck in "reconnecting" with a stale
    // token, or connected with a different token), tear it down fully so
    // socket.io-client does not return the cached/multiplexed instance.
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }

    this.currentToken = token

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      forceNew: true,
    })

    this.socket.on('connect', () => {
      // Successful connection — reset the refresh guard so future token issues
      // can self-heal again.
      this.refreshAttemptedForToken = ''

      // Re-attach all registered listeners after reconnect
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((cb) => {
          this.socket?.on(event, cb)
        })
      })
    })

    this.socket.on('connect_error', () => {
      // Self-heal path: mirrors REST's 401 → refresh → retry flow.
      // Only attempt one refresh per bad token value to prevent infinite loops.
      if (!this.tokenRefresher) return
      if (this.refreshAttemptedForToken === this.currentToken) return

      this.refreshAttemptedForToken = this.currentToken

      this.tokenRefresher().then((newToken) => {
        if (!newToken || newToken === this.currentToken) {
          // Refresh failed or returned the same (still-bad) token — stop.
          return
        }

        // Apply the fresh token and retry the connection.
        this.currentToken = newToken
        if (this.socket) {
          this.socket.auth = { token: newToken }
          this.socket.connect()
        }
      })
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
    this.currentToken = ''
    this.refreshAttemptedForToken = ''
  }

  setTokenRefresher(fn: () => Promise<string | null>): void {
    this.tokenRefresher = fn
  }

  subscribe<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const cb = callback as EventCallback
    this.listeners.get(event)!.add(cb)
    this.socket?.on(event, cb)

    return () => {
      this.listeners.get(event)?.delete(cb)
      this.socket?.off(event, cb)
    }
  }

  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data)
  }

  get connected(): boolean {
    return this.socket?.connected ?? false
  }

  get status(): 'connected' | 'reconnecting' | 'disconnected' {
    if (!this.socket) return 'disconnected'
    if (this.socket.connected) return 'connected'
    if (this.socket.active) return 'reconnecting'
    return 'disconnected'
  }

  onStatusChange(
    callback: (status: 'connected' | 'reconnecting' | 'disconnected') => void,
  ): () => void {
    const onConnect = () => callback('connected')
    const onDisconnect = () => callback('disconnected')
    const onReconnecting = () => callback('reconnecting')

    this.socket?.on('connect', onConnect)
    this.socket?.on('disconnect', onDisconnect)
    this.socket?.on('reconnect_attempt', onReconnecting)

    return () => {
      this.socket?.off('connect', onConnect)
      this.socket?.off('disconnect', onDisconnect)
      this.socket?.off('reconnect_attempt', onReconnecting)
    }
  }
}

// Singleton instance
export const socketClient = new SocketClient()
export default socketClient
