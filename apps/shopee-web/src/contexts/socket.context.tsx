import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import type { Socket } from 'socket.io-client'
import { getAccessTokenFromLS } from 'src/utils/auth'
import config from 'src/constant/config'
import { ConnectionStatus } from 'src/types/socket.types'
import { AppContext } from 'src/contexts/app.context'

interface SocketContextInterface {
  socket: Socket | null
  isConnected: boolean
  connectionStatus: ConnectionStatus
  connect: () => void
  disconnect: () => void
}

const initialSocketContext: SocketContextInterface = {
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  connect: () => null,
  disconnect: () => null
}

export const SocketContext = createContext<SocketContextInterface>(initialSocketContext)

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useContext(AppContext)
  const socketRef = useRef<Socket | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')

  const isConnected = connectionStatus === 'connected'

  const connect = useCallback(async () => {
    if (socketRef.current?.connected || !isAuthenticated) {
      return
    }

    const token = getAccessTokenFromLS()
    if (!token) {
      return
    }

    /**
     * Mock mode: Khi `config.enableSocket` = false (frontend-only, không có backend WebSocket),
     * giả lập trạng thái 'connected' để tránh hiện banner "Lỗi kết nối".
     * Khi có backend thực sự, đặt `enableSocket: true` trong src/constant/config.ts.
     *
     * Mock mode: When `config.enableSocket` is false (frontend-only, no backend WebSocket),
     * simulate 'connected' status to avoid showing the "Connection Error" banner.
     * When a real backend is available, set `enableSocket: true` in src/constant/config.ts.
     */
    if (!config.enableSocket) {
      setConnectionStatus('connected')
      return
    }

    try {
      setConnectionStatus('connecting')

      // Dynamic import socket.io-client - only loaded when actually connecting
      const { io } = await import('socket.io-client')

      const newSocket = io(config.socketUrl, {
        auth: { token },
        transports: ['websocket'],
        autoConnect: false
      })

      newSocket.on('connect', () => {
        setConnectionStatus('connected')
        setSocket(newSocket)
      })

      newSocket.on('disconnect', () => {
        setConnectionStatus('disconnected')
      })

      newSocket.on('connect_error', () => {
        setConnectionStatus('error')
      })

      newSocket.on('token_expired', () => {
        setConnectionStatus('disconnected')
        newSocket.disconnect()
      })

      newSocket.on('auth_error', () => {
        setConnectionStatus('disconnected')
        newSocket.disconnect()
      })

      socketRef.current = newSocket
      newSocket.connect()
    } catch (error) {
      console.error('Failed to load socket.io-client:', error)
      setConnectionStatus('disconnected')
    }
  }, [isAuthenticated])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
      setConnectionStatus('disconnected')
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }
  }, [isAuthenticated, connect, disconnect])

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      connectionStatus,
      connect,
      disconnect
    }),
    [socket, isConnected, connectionStatus, connect, disconnect]
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocketContext = () => {
  return useContext(SocketContext)
}
