import { useSocketContext } from 'src/contexts/socket.context'

const useSocket = () => {
  const { socket, isConnected, connectionStatus, connect, disconnect } = useSocketContext()

  const emit = (event: string, data?: unknown) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    }
  }

  const on = (event: string, handler: (...args: unknown[]) => void) => {
    if (socket) {
      socket.on(event, handler)
    }
  }

  const off = (event: string, handler?: (...args: unknown[]) => void) => {
    if (socket) {
      socket.off(event, handler)
    }
  }

  return { socket, isConnected, connectionStatus, connect, disconnect, emit, on, off }
}

export default useSocket
