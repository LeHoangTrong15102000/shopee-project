import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { ALLOWED_ORIGINS } from '@constants/cors.config'
import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent } from '../@types/socket.type'
import { socketAuthMiddleware } from '@middleware/socket-auth.middleware'
import { Logger } from '@utils/logger'
import { registerConnectionHandlers, handleConnect } from './handlers/connection.handler'
import { registerChatHandlers } from './handlers/chat.handler'
import { registerNotificationHandlers, sendPendingNotifications } from './handlers/notification.handler'
import { registerProductHandlers, joinAdminRoomIfAdmin } from './handlers/product.handler'
import { registerPresenceHandlers } from './handlers/presence.handler'
import { registerOrderHandlers } from './handlers/order.handler'
import { registerFlashSaleHandlers } from './handlers/flash-sale.handler'
import { registerSellerDashboardHandlers } from './handlers/seller-dashboard.handler'
import { startPeriodicSellerMetrics, stopPeriodicSellerMetrics } from './utils/seller-metrics.service'

// Singleton Socket.io server instance
let io: SocketIOServer | null = null

/**
 * Initialize Socket.io server with HTTP server
 * Sets up CORS, auth middleware, and connection handling
 */
export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: SOCKET_CONFIG.CORS.METHODS,
      credentials: true,
    },
    pingTimeout: SOCKET_CONFIG.PING_TIMEOUT,
    pingInterval: SOCKET_CONFIG.PING_INTERVAL,
    maxHttpBufferSize: SOCKET_CONFIG.MAX_HTTP_BUFFER_SIZE,
    transports: ['websocket', 'polling'],
  })

  // Apply authentication middleware
  io.use(socketAuthMiddleware)

  // Handle new connections
  io.on(SocketEvent.CONNECT, (socket) => {
    const userId = socket.user?.id

    Logger.apiInfo('Socket connected', {
      socketId: socket.id,
      userId,
    })

    // Join user's personal room for direct notifications
    if (userId) {
      const userRoom = `${SOCKET_CONFIG.ROOM_PREFIX.USER}${userId}`
      socket.join(userRoom)

      // Auto-join broadcast room for admin broadcast notifications
      const broadcastRoom = `${SOCKET_CONFIG.ROOM_PREFIX.BROADCAST}all`
      socket.join(broadcastRoom)

      Logger.apiInfo('User joined personal room', {
        socketId: socket.id,
        userId,
        room: userRoom,
      })
    }

    // Send connection confirmation to client
    socket.emit(SocketEvent.CONNECTED, {
      user_id: userId,
      socket_id: socket.id,
    })

    // Register all event handlers
    handleConnect(socket)
    joinAdminRoomIfAdmin(socket)
    registerConnectionHandlers(socket)
    registerChatHandlers(socket)
    registerNotificationHandlers(socket)
    registerProductHandlers(socket)
    registerPresenceHandlers(socket)
    registerOrderHandlers(socket)
    registerFlashSaleHandlers(socket)
    registerSellerDashboardHandlers(socket)

    // Send pending notifications on connect
    sendPendingNotifications(socket)
  })

  Logger.apiInfo('Socket.io server initialized')

  // Start periodic seller metrics emission
  startPeriodicSellerMetrics()

  return io
}

/**
 * Get the Socket.io server instance
 * Returns null if not initialized
 */
export const getIO = (): SocketIOServer | null => {
  return io
}

/**
 * Get the Socket.io server instance (throws if not initialized)
 */
export const getIORequired = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io server not initialized. Call initializeSocket() first.')
  }
  return io
}

/**
 * Gracefully shutdown Socket.io server and stop periodic tasks
 */
export const shutdownSocket = (): void => {
  stopPeriodicSellerMetrics()
  if (io) {
    io.close()
    io = null
  }
  Logger.apiInfo('Socket.io server shut down')
}

