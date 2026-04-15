import { Socket } from 'socket.io'
import {
  SocketEvent,
  SubscribeProductPayload,
  ViewerCountUpdatePayload,
} from '../../@types/socket.type'
import { SOCKET_CONFIG, SOCKET_ERRORS } from '@constants/socket'
import { ROLE } from '@constants/role.enum'
import { Logger } from '@utils/logger'
import { emitActivityBuffer } from '../utils/activity-emit'
import { getIORequired } from '../socket.init'

// Debounce map for viewer count updates
const viewerCountDebounceMap = new Map<string, ReturnType<typeof setTimeout>>()
const VIEWER_COUNT_DEBOUNCE_MS = 2000

/**
 * Emit viewer count update with debouncing to prevent excessive broadcasts
 */
const emitViewerCountUpdate = (socket: Socket, productId: string, roomName: string): void => {
  // Clear existing debounce timer for this room
  const existingTimer = viewerCountDebounceMap.get(roomName)
  if (existingTimer) clearTimeout(existingTimer)

  const timer = setTimeout(async () => {
    try {
      const io = getIORequired()
      const roomSize = io.sockets.adapter.rooms.get(roomName)?.size ?? 0
      const payload: ViewerCountUpdatePayload = {
        product_id: productId,
        viewer_count: roomSize,
      }
      io.to(roomName).emit(SocketEvent.VIEWER_COUNT_UPDATE, payload)
      Logger.apiInfo('Viewer count update emitted', {
        productId,
        roomName,
        viewerCount: roomSize,
      })
    } catch (error) {
      Logger.apiError('Failed to emit viewer count update', {
        productId,
        error: error instanceof Error ? error.message : error,
      })
    }
    viewerCountDebounceMap.delete(roomName)
  }, VIEWER_COUNT_DEBOUNCE_MS)

  viewerCountDebounceMap.set(roomName, timer)
}

/**
 * Get product room name from product ID
 */
export const getProductRoomName = (productId: string): string =>
  `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}${productId}`

/**
 * Get admin notifications room name
 */
export const getAdminNotificationRoom = (): string =>
  `${SOCKET_CONFIG.ROOM_PREFIX.ADMIN}notifications`

/**
 * Register product room event handlers on a socket connection.
 */
export const registerProductHandlers = (socket: Socket): void => {
  // Subscribe to product updates
  socket.on(SocketEvent.SUBSCRIBE_PRODUCT, (payload: SubscribeProductPayload) => {
    try {
      if (!payload?.product_id) {
        socket.emit(SocketEvent.ERROR, {
          code: SOCKET_ERRORS.INVALID_PAYLOAD,
          message: 'product_id is required',
        })
        return
      }

      const roomName = getProductRoomName(payload.product_id)
      socket.join(roomName)

      // Emit viewer count update (debounced)
      emitViewerCountUpdate(socket, payload.product_id, roomName)

      Logger.apiInfo('Socket subscribed to product room', {
        socketId: socket.id,
        userId: socket.user?.id,
        productId: payload.product_id,
        room: roomName,
      })

      // Send activity buffer to the newly joined socket
      emitActivityBuffer(socket.id, payload.product_id)
    } catch (error) {
      Logger.apiError('Error subscribing to product', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      })
    }
  })

  // Unsubscribe from product updates
  socket.on(SocketEvent.UNSUBSCRIBE_PRODUCT, (payload: SubscribeProductPayload) => {
    try {
      if (!payload?.product_id) {
        return
      }

      const roomName = getProductRoomName(payload.product_id)
      socket.leave(roomName)

      // Emit viewer count update (debounced)
      emitViewerCountUpdate(socket, payload.product_id, roomName)

      Logger.apiInfo('Socket unsubscribed from product room', {
        socketId: socket.id,
        userId: socket.user?.id,
        productId: payload.product_id,
        room: roomName,
      })
    } catch (error) {
      Logger.apiError('Error unsubscribing from product', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      })
    }
  })
}

/**
 * Auto-join admin users to the admin notifications room.
 * Should be called on connection for users with Admin role.
 */
export const joinAdminRoomIfAdmin = (socket: Socket): void => {
  const roles = socket.user?.roles ?? []
  if (roles.includes(ROLE.ADMIN)) {
    const adminRoom = getAdminNotificationRoom()
    socket.join(adminRoom)

    // Auto-join admin dashboard room for admin-targeted broadcast events
    const dashboardRoom = `${SOCKET_CONFIG.ROOM_PREFIX.ADMIN}dashboard`
    socket.join(dashboardRoom)

    Logger.apiInfo('Admin user joined admin rooms', {
      socketId: socket.id,
      userId: socket.user?.id,
      rooms: [adminRoom, dashboardRoom],
    })
  }
}
