import { useCallback } from 'react'
import { useSocketContext } from 'src/contexts/socket.context'

const useSocket = () => {
  const { socket, isConnected, connectionStatus, connect, disconnect } = useSocketContext()

  const emit = useCallback(
    (event: string, data?: unknown) => {
      if (socket && isConnected) {
        socket.emit(event, data)
      }
    },
    [socket, isConnected]
  )

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      if (socket) {
        socket.on(event, handler)
      }
    },
    [socket]
  )

  const off = useCallback(
    (event: string, handler?: (...args: unknown[]) => void) => {
      if (socket) {
        socket.off(event, handler)
      }
    },
    [socket]
  )

  return { socket, isConnected, connectionStatus, connect, disconnect, emit, on, off }
}

export default useSocket
