import { Socket } from 'socket.io'
import { RateLimiterRedis, RateLimiterMemory, RateLimiterAbstract } from 'rate-limiter-flexible'
import { redisClient } from '@utils/redis.client'
import { SocketEvent, SocketErrorPayload } from '../../@types/socket.type'
import { SOCKET_CONFIG, SOCKET_ERRORS } from '@constants/socket'
import { Logger } from '@utils/logger'
import { addUserSocket, removeUserSocket, getUserPresence } from '../managers/presence.manager'
import { broadcastPresenceUpdate } from './presence.handler'
import { ROLE } from '@constants/role.enum'
import { getIORequired } from '../socket.init'

// ============ Socket rate limiter ============

const SOCKET_POINTS = SOCKET_CONFIG.RATE_LIMIT.MAX_EVENTS_PER_SECOND // 10
const SOCKET_DURATION = Math.floor(SOCKET_CONFIG.RATE_LIMIT.WINDOW_MS / 1000) // 1 second

function buildSocketLimiter(): RateLimiterAbstract {
  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:socket',
      points: SOCKET_POINTS,
      duration: SOCKET_DURATION,
      insuranceLimiter: new RateLimiterMemory({
        points: SOCKET_POINTS,
        duration: SOCKET_DURATION,
      }),
    })
  }
  return new RateLimiterMemory({
    keyPrefix: 'rl:socket',
    points: SOCKET_POINTS,
    duration: SOCKET_DURATION,
  })
}

const socketRateLimiter = buildSocketLimiter()

/**
 * Creates a rate limiter middleware for socket events.
 * Returns a function that wraps event handlers with rate limiting logic.
 */
export const createRateLimiter = (socket: Socket): ((callback: () => void) => void) => {
  return (callback: () => void): void => {
    socketRateLimiter
      .consume(socket.id)
      .then(() => {
        callback()
      })
      .catch(() => {
        Logger.apiWarn(`Rate limit exceeded for socket ${socket.id}, user ${socket.user?.id}`)
        const payload: SocketErrorPayload = {
          code: SOCKET_ERRORS.RATE_LIMITED,
          message: 'Too many requests. Please slow down.',
        }
        socket.emit(SocketEvent.RATE_LIMITED, payload)
      })
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

    const cartRoom = `${SOCKET_CONFIG.ROOM_PREFIX.CART}${userId}`
    socket.join(cartRoom)
    Logger.apiInfo('User joined cart room', {
      socketId: socket.id,
      userId,
      room: cartRoom,
    })

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
 * Deletes the Redis rate-limit key for this socket to prevent key accumulation.
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

  // Viewer count cleanup
  try {
    const productPrefix = SOCKET_CONFIG.ROOM_PREFIX.PRODUCT
    const productRooms = Array.from(socket.rooms).filter((room) => room.startsWith(productPrefix))

    if (productRooms.length > 0) {
      const io = getIORequired()
      for (const roomName of productRooms) {
        const productId = roomName.slice(productPrefix.length)
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

  // Clean up Redis rate-limit key for this socket
  socketRateLimiter.delete(socket.id).catch(() => {
    // Ignore errors on cleanup — key may have already expired
  })
}

/**
 * Handles socket errors by logging and emitting a sanitized error to the client.
 */
export const handleError = (socket: Socket, error: Error): void => {
  const userId = socket.user?.id ?? 'unknown'

  Logger.apiError(`Socket error for ${socket.id}, user: ${userId}, error: ${error.message}`)

  const payload: SocketErrorPayload = {
    code: SOCKET_ERRORS.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
  }
  socket.emit(SocketEvent.ERROR, payload)
}

/**
 * Registers all connection lifecycle handlers on a socket instance.
 */
export const registerConnectionHandlers = (socket: Socket): void => {
  socket.on(SocketEvent.DISCONNECT, (reason: string) => {
    handleDisconnect(socket, reason)
  })

  socket.on(SocketEvent.ERROR, (error: Error) => {
    handleError(socket, error)
  })
}
