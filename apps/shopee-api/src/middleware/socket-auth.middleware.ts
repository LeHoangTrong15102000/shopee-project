import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { config } from '@constants/config'
import { verifyToken } from '@utils/jwt'
import { SOCKET_ERRORS } from '@constants/socket'
import { SocketUserData } from '../@types/socket.type'
import { Logger } from '@utils/logger'

// Extend Socket interface to include user data
declare module 'socket.io' {
  interface Socket {
    user: SocketUserData
  }
}

/**
 * Socket.io authentication middleware
 * Verifies JWT token from handshake auth and attaches user data to socket
 */
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: ExtendedError) => void,
): Promise<void> => {
  try {
    const token = socket.handshake.auth?.token as string

    if (!token) {
      Logger.apiWarn('Socket connection rejected: No token provided', {
        socketId: socket.id,
      })
      return next(new Error(SOCKET_ERRORS.AUTH_ERROR))
    }

    // Verify JWT token — pure stateless verification, no database lookup
    const decoded = (await verifyToken(token, config.SECRET_KEY)) as {
      id: string
      email: string
      roles: string[]
      created_at: string
    }

    // Attach user data to socket
    socket.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles,
    }

    Logger.apiInfo('Socket authenticated successfully', {
      socketId: socket.id,
      userId: decoded.id,
    })

    next()
  } catch (error: any) {
    const errorCode =
      error?.message?.name === 'EXPIRED_TOKEN'
        ? SOCKET_ERRORS.TOKEN_EXPIRED
        : SOCKET_ERRORS.AUTH_ERROR

    Logger.apiError('Socket authentication failed', {
      socketId: socket.id,
      error: error?.message,
    })

    next(new Error(errorCode))
  }
}
