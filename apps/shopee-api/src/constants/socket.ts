// Socket.io configuration constants

export const SOCKET_CONFIG = {
  // CORS - reuse allowed origins pattern from cors.config.ts
  CORS: {
    METHODS: ['GET', 'POST'],
  },

  // Connection
  PING_TIMEOUT: 60000, // 60 seconds
  PING_INTERVAL: 25000, // 25 seconds
  MAX_HTTP_BUFFER_SIZE: 1e6, // 1MB

  // Rate limiting
  RATE_LIMIT: {
    MAX_EVENTS_PER_SECOND: 10,
    WINDOW_MS: 1000,
  },

  // Rooms
  ROOM_PREFIX: {
    CHAT: 'chat:',
    USER: 'user:',
    NOTIFICATION: 'notification:',
    PRODUCT: 'product:',
    ADMIN: 'admin:',
    ORDER: 'order:',
    FLASH_SALE: 'flash_sale:',
    CART: 'cart:',
    SELLER: 'seller:',
    BROADCAST: 'broadcast:',
  },

  // Inventory
  INVENTORY: {
    LOW_STOCK_THRESHOLD: 10,
  },
}

// Socket error codes
export const SOCKET_ERRORS = {
  AUTH_ERROR: 'AUTH_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
}
