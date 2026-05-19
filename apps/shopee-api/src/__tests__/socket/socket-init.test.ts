/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
}))

jest.mock('@constants/cors.config', () => ({
  ALLOWED_ORIGINS: ['http://localhost:3000'],
}))

jest.mock('@constants/socket', () => ({
  SOCKET_CONFIG: {
    CORS: { METHODS: ['GET', 'POST'] },
    PING_TIMEOUT: 60000,
    PING_INTERVAL: 25000,
    MAX_HTTP_BUFFER_SIZE: 1e6,
    ROOM_PREFIX: { USER: 'user:', BROADCAST: 'broadcast:' },
  },
}))

jest.mock('@middleware/socket-auth.middleware', () => ({
  socketAuthMiddleware: jest.fn(),
}))

jest.mock('../../socket/handlers/connection.handler', () => ({
  registerConnectionHandlers: jest.fn(),
  handleConnect: jest.fn(),
}))

jest.mock('../../socket/handlers/chat.handler', () => ({
  registerChatHandlers: jest.fn(),
}))

jest.mock('../../socket/handlers/notification.handler', () => ({
  registerNotificationHandlers: jest.fn(),
  sendPendingNotifications: jest.fn(),
}))

jest.mock('../../socket/handlers/product.handler', () => ({
  registerProductHandlers: jest.fn(),
  joinAdminRoomIfAdmin: jest.fn(),
}))

jest.mock('../../socket/handlers/presence.handler', () => ({
  registerPresenceHandlers: jest.fn(),
}))

jest.mock('../../socket/handlers/order.handler', () => ({
  registerOrderHandlers: jest.fn(),
}))

jest.mock('../../socket/handlers/flash-sale.handler', () => ({
  registerFlashSaleHandlers: jest.fn(),
}))

jest.mock('../../socket/handlers/seller-dashboard.handler', () => ({
  registerSellerDashboardHandlers: jest.fn(),
}))

jest.mock('../../socket/handlers/shop-chat.handler', () => ({
  registerShopChatHandlers: jest.fn(),
}))

jest.mock('../../socket/utils/seller-metrics.service', () => ({
  startPeriodicSellerMetrics: jest.fn(),
  stopPeriodicSellerMetrics: jest.fn(),
}))

const mockUse = jest.fn()
const mockOn = jest.fn()

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    use: mockUse,
    on: mockOn,
  })),
}))

describe('socket.init', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('getIO returns null before initialization', async () => {
    const { getIO } = await import('../../socket/socket.init')
    expect(getIO()).toBeNull()
  })

  it('getIORequired throws Error before initialization', async () => {
    const { getIORequired } = await import('../../socket/socket.init')
    expect(() => getIORequired()).toThrow(
      'Socket.io server not initialized. Call initializeSocket() first.',
    )
  })

  it('initializeSocket creates SocketIOServer with correct config', async () => {
    const { Server } = await import('socket.io')
    const { initializeSocket } = await import('../../socket/socket.init')

    initializeSocket({} as any)

    expect(Server).toHaveBeenCalledWith(
      {},
      {
        cors: {
          origin: ['http://localhost:3000'],
          methods: ['GET', 'POST'],
          credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e6,
        transports: ['websocket', 'polling'],
      },
    )
  })

  it('initializeSocket applies socketAuthMiddleware', async () => {
    const { socketAuthMiddleware } = await import('@middleware/socket-auth.middleware')
    const { initializeSocket } = await import('../../socket/socket.init')

    initializeSocket({} as any)

    expect(mockUse).toHaveBeenCalledWith(socketAuthMiddleware)
  })

  it('initializeSocket registers connect handler', async () => {
    const { initializeSocket } = await import('../../socket/socket.init')

    initializeSocket({} as any)

    expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function))
  })

  it('initializeSocket returns the io instance', async () => {
    const { initializeSocket } = await import('../../socket/socket.init')

    const io = initializeSocket({} as any)

    expect(io).toEqual({ use: mockUse, on: mockOn })
  })

  it('getIO returns io instance after initialization', async () => {
    const { initializeSocket, getIO } = await import('../../socket/socket.init')

    initializeSocket({} as any)

    expect(getIO()).toEqual({ use: mockUse, on: mockOn })
  })

  it('getIORequired returns io instance after initialization', async () => {
    const { initializeSocket, getIORequired } = await import('../../socket/socket.init')

    initializeSocket({} as any)

    expect(getIORequired()).toEqual({ use: mockUse, on: mockOn })
  })

  it('connect handler joins user room, emits connected, registers all handlers', async () => {
    const { handleConnect, registerConnectionHandlers } =
      await import('../../socket/handlers/connection.handler')
    const { registerChatHandlers } = await import('../../socket/handlers/chat.handler')
    const { registerNotificationHandlers, sendPendingNotifications } =
      await import('../../socket/handlers/notification.handler')
    const { registerProductHandlers, joinAdminRoomIfAdmin } =
      await import('../../socket/handlers/product.handler')
    const { registerPresenceHandlers } = await import('../../socket/handlers/presence.handler')
    const { registerOrderHandlers } = await import('../../socket/handlers/order.handler')
    const { registerFlashSaleHandlers } = await import('../../socket/handlers/flash-sale.handler')
    const { registerSellerDashboardHandlers } =
      await import('../../socket/handlers/seller-dashboard.handler')
    const { registerShopChatHandlers } = await import('../../socket/handlers/shop-chat.handler')
    const { initializeSocket } = await import('../../socket/socket.init')

    initializeSocket({} as any)

    const connectCall = mockOn.mock.calls.find(([event]: [string]) => event === 'connect')
    const connectHandler = connectCall![1]

    const mockSocket = {
      id: 'socket-1',
      user: { id: 'user-1', email: 'test@test.com', roles: ['User'] },
      join: jest.fn(),
      emit: jest.fn(),
    }

    connectHandler(mockSocket)

    expect(mockSocket.join).toHaveBeenCalledWith('user:user-1')
    expect(mockSocket.join).toHaveBeenCalledWith('broadcast:all')
    expect(mockSocket.emit).toHaveBeenCalledWith('connected', {
      user_id: 'user-1',
      socket_id: 'socket-1',
    })
    expect(handleConnect).toHaveBeenCalledWith(mockSocket)
    expect(joinAdminRoomIfAdmin).toHaveBeenCalledWith(mockSocket)
    expect(registerConnectionHandlers).toHaveBeenCalledWith(mockSocket)
    expect(registerChatHandlers).toHaveBeenCalledWith(mockSocket)
    expect(registerNotificationHandlers).toHaveBeenCalledWith(mockSocket)
    expect(registerProductHandlers).toHaveBeenCalledWith(mockSocket)
    expect(registerPresenceHandlers).toHaveBeenCalledWith(mockSocket)
    expect(registerOrderHandlers).toHaveBeenCalledWith(mockSocket)
    expect(registerFlashSaleHandlers).toHaveBeenCalledWith(mockSocket)
    expect(registerSellerDashboardHandlers).toHaveBeenCalledWith(mockSocket)
    expect(registerShopChatHandlers).toHaveBeenCalledWith(mockSocket)
    expect(sendPendingNotifications).toHaveBeenCalledWith(mockSocket)
  })
})
