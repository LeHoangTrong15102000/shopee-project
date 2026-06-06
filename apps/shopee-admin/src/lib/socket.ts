import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000'

type EventCallback<T = unknown> = (data: T) => void

class SocketClient {
  private socket: Socket | null = null
  private listeners: Map<string, Set<EventCallback>> = new Map()

  connect(token: string): void {
    if (this.socket?.connected) return

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    })

    this.socket.on('connect', () => {
      // Re-attach all registered listeners after reconnect
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((cb) => {
          this.socket?.on(event, cb)
        })
      })
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
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
