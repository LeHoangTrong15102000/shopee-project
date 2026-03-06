import { Socket } from 'socket.io'
import { SocketEvent, SocketErrorPayload } from '../../@types/socket.type'
import { SOCKET_CONFIG, SOCKET_ERRORS } from '@constants/socket'
import { Logger } from '@utils/logger'
import { addUserSocket, removeUserSocket, getUserPresence } from '../managers/presence.manager'
import { broadcastPresenceUpdate } from './presence.handler'
import { ROLE } from '@constants/role.enum'
import { getIORequired } from '../socket.init'

interface RateLimitState {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitState>()

/**
 * Creates a rate limiter middleware for socket events.
 * Returns a function that wraps event handlers with rate limiting logic.
 * Uses sliding window algorithm to track events per socket.
 */
export const createRateLimiter = (socket: Socket): ((callback: () => void) => void) => {
  const { MAX_EVENTS_PER_SECOND, WINDOW_MS } = SOCKET_CONFIG.RATE_LIMIT

  return (callback: () => void): void => {
    const now = Date.now()
    const socketId = socket.id
    let state = rateLimitMap.get(socketId)

    if (!state || now >= state.resetTime) {
      state = { count: 0, resetTime: now + WINDOW_MS }
      rateLimitMap.set(socketId, state)
    }

    state.count++

    if (state.count > MAX_EVENTS_PER_SECOND) {
      Logger.apiWarn(`Rate limit exceeded for socket ${socketId}, user ${socket.user?.id}`)
      const payload: SocketErrorPayload = {
        code: SOCKET_ERRORS.RATE_LIMITED,
        message: 'Too many requests. Please slow down.'
      }
      socket.emit(SocketEvent.RATE_LIMITED, payload)
      return
    }

    callback()
  }
}

/**
 * Handles socket connection and sets up presence tracking.
 */
export const handleConnect = (socket: Socket): void => {
  const userId = socket.user?.id
  if (userId) {
    addUserSocket(userId, socket.id)
    broadcastPresenceUpdate(socket, userId, 'online')

    // Auto-join cart room for cross-device cart sync
    const cartRoom = `${SOCKET_CONFIG.ROOM_PREFIX.CART}${userId}`
    socket.join(cartRoom)
    Logger.apiInfo('User joined cart room', {
      socketId: socket.id,
      userId,
      room: cartRoom,
    })

    // Auto-join Admin users to seller dashboard room
    const roles = socket.user?.roles ?? []
    if (roles.includes(ROLE.ADMIN)) {
      const sellerRoom = `${SOCKET_CONFIG.ROOM_PREFIX.SELLER}${userId}`
      socket.join(sellerRoom)
      Logger.apiInfo('Admin user joined seller dashboard room', {
        socketId: socket.id,
        userId,
        room: sellerRoom,
      })
    }
  }
}

/**
 * Handles socket disconnection and performs cleanup.
 * Removes rate limit tracking data to prevent memory leaks.
 */
export const handleDisconnect = (socket: Socket, reason: string): void => {
  const userId = socket.user?.id ?? 'unknown'

  Logger.apiInfo(`Socket disconnected: ${socket.id}, user: ${userId}, reason: ${reason}`)

  // Presence cleanup
  if (userId !== 'unknown') {
    const wentOffline = removeUserSocket(userId, socket.id)
    if (wentOffline) {
      const presence = getUserPresence(userId)
      broadcastPresenceUpdate(socket, userId, 'offline', presence.lastSeen)
    }
  }

  // Viewer count cleanup: emit updated viewer count for product rooms
  try {
    const productPrefix = SOCKET_CONFIG.ROOM_PREFIX.PRODUCT
    const productRooms = Array.from(socket.rooms).filter((room) => room.startsWith(productPrefix))

    if (productRooms.length > 0) {
      const io = getIORequired()
      for (const roomName of productRooms) {
        const productId = roomName.slice(productPrefix.length)
        // Room size will be decremented after disconnect completes,
        // so we subtract 1 from current size (or use 0 if already 0)
        const currentSize = io.sockets.adapter.rooms.get(roomName)?.size ?? 0
        const viewerCount = Math.max(0, currentSize - 1)

        io.to(roomName).emit(SocketEvent.VIEWER_COUNT_UPDATE, {
          product_id: productId,
          viewer_count: viewerCount,
        })
      }

      Logger.apiInfo('Viewer count updated on disconnect', {
        socketId: socket.id,
        userId,
        productRoomCount: productRooms.length,
      })
    }
  } catch (error) {
    Logger.apiError('Failed to update viewer count on disconnect', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : error,
    })
  }

  rateLimitMap.delete(socket.id)
}

/**
 * Handles socket errors by logging and emitting a sanitized error to the client.
 * Internal error details are not exposed to prevent information leakage.
 */
export const handleError = (socket: Socket, error: Error): void => {
  const userId = socket.user?.id ?? 'unknown'

  Logger.apiError(`Socket error for ${socket.id}, user: ${userId}, error: ${error.message}`)

  const payload: SocketErrorPayload = {
    code: SOCKET_ERRORS.INTERNAL_ERROR,
    message: 'An unexpected error occurred'
  }
  socket.emit(SocketEvent.ERROR, payload)
}

/**
 * Registers all connection lifecycle handlers on a socket instance.
 * Should be called when a new socket connection is established.
 */
export const registerConnectionHandlers = (socket: Socket): void => {
  socket.on(SocketEvent.DISCONNECT, (reason: string) => {
    handleDisconnect(socket, reason)
  })

  socket.on(SocketEvent.ERROR, (error: Error) => {
    handleError(socket, error)
  })
}

