import { Socket } from 'socket.io'
import {
  SocketEvent,
  GetPresencePayload,
  PresenceStatusPayload,
  PresenceUpdatePayload,
} from '../../@types/socket.type'
import { SOCKET_ERRORS } from '@constants/socket'
import { Logger } from '@utils/logger'
import { getUserPresence } from '../managers/presence.manager'

/**
 * Register presence event handlers on a socket connection.
 */
export const registerPresenceHandlers = (socket: Socket): void => {
  // Handle get_presence requests
  socket.on(SocketEvent.GET_PRESENCE, (payload: GetPresencePayload) => {
    try {
      if (!payload?.user_id) {
        socket.emit(SocketEvent.ERROR, {
          code: SOCKET_ERRORS.INVALID_PAYLOAD,
          message: 'user_id is required',
        })
        return
      }

      const presence = getUserPresence(payload.user_id)
      const response: PresenceStatusPayload = {
        user_id: payload.user_id,
        status: presence.status,
        last_seen: presence.lastSeen,
      }

      socket.emit(SocketEvent.PRESENCE_STATUS, response)

      Logger.apiInfo('Presence query handled', {
        requestedBy: socket.user?.id,
        queriedUser: payload.user_id,
        status: presence.status,
      })
    } catch (error) {
      Logger.apiError('Error handling get_presence', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      })
    }
  })
}

/**
 * Broadcast a presence update to all connected clients in a user's room.
 * Called when a user goes online or offline.
 */
export const broadcastPresenceUpdate = (
  socket: Socket,
  userId: string,
  status: 'online' | 'offline',
  lastSeen?: string | null,
): void => {
  try {
    const payload: PresenceUpdatePayload = {
      user_id: userId,
      status,
      last_seen: lastSeen ?? null,
    }

    // Broadcast to all connected sockets (everyone can see presence changes)
    socket.broadcast.emit(SocketEvent.PRESENCE_UPDATE, payload)

    Logger.apiInfo('Presence update broadcast', { userId, status })
  } catch (error) {
    Logger.apiError('Failed to broadcast presence update', {
      userId,
      status,
      error: error instanceof Error ? error.message : error,
    })
  }
}
