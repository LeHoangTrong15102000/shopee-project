/// <reference types="jest" />

jest.mock('../../database/models/notification.model', () => ({
  NotificationModel: {
    findOne: jest.fn(),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ lean: jest.fn() }) }),
    }),
    create: jest.fn(),
    updateOne: jest.fn(),
  },
  NotificationType: { ORDER: 'order', PROMOTION: 'promotion', SYSTEM: 'system' },
}))

jest.mock('../../utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn() },
}))

jest.mock('../../constants/socket', () => ({
  SOCKET_CONFIG: { ROOM_PREFIX: { USER: 'user:' } },
  SOCKET_ERRORS: { INVALID_PAYLOAD: 'INVALID_PAYLOAD', INTERNAL_ERROR: 'INTERNAL_ERROR' },
}))

import { createMockSocket, createMockIO } from './setup'
import { NotificationModel } from '../../database/models/notification.model'
import {
  registerNotificationHandlers,
  sendPendingNotifications,
  pushNotification,
} from '../../socket/handlers/notification.handler'
import { SocketEvent } from '../../@types/socket.type'

describe('notification.handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerNotificationHandlers', () => {
    it('should register NOTIFICATION_READ event listener', () => {
      const mockSocket = createMockSocket() as any

      registerNotificationHandlers(mockSocket)

      expect(mockSocket.on).toHaveBeenCalledWith(
        SocketEvent.NOTIFICATION_READ,
        expect.any(Function),
      )
    })
  })

  describe('NOTIFICATION_READ event', () => {
    it('should mark notification as read when valid', async () => {
      const mockSocket = createMockSocket() as any
      const mockNotification = { _id: 'notif-123' }
      ;(NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification)
      ;(NotificationModel.updateOne as jest.Mock).mockResolvedValue({})

      registerNotificationHandlers(mockSocket)
      const readHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.NOTIFICATION_READ,
      )[1]
      await readHandler({ notification_id: 'notif-123' })

      expect(NotificationModel.findOne).toHaveBeenCalledWith({
        _id: 'notif-123',
        user: 'test-user-id',
      })
      expect(NotificationModel.updateOne).toHaveBeenCalledWith(
        { _id: 'notif-123' },
        { is_read: true },
      )
    })

    it('should emit error when notification_id is missing', async () => {
      const mockSocket = createMockSocket() as any

      registerNotificationHandlers(mockSocket)
      const readHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.NOTIFICATION_READ,
      )[1]
      await readHandler({})

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SocketEvent.ERROR,
        expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
      )
    })

    it('should emit error when notification not found', async () => {
      const mockSocket = createMockSocket() as any
      ;(NotificationModel.findOne as jest.Mock).mockResolvedValue(null)

      registerNotificationHandlers(mockSocket)
      const readHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.NOTIFICATION_READ,
      )[1]
      await readHandler({ notification_id: 'invalid-id' })

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SocketEvent.ERROR,
        expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
      )
    })
  })

  describe('sendPendingNotifications', () => {
    it('should fetch and emit unread notifications', async () => {
      const mockSocket = createMockSocket() as any
      const mockNotifications = [
        {
          _id: { toString: () => 'n1' },
          title: 'Test',
          content: 'Content',
          type: 'order',
          createdAt: new Date('2024-01-01'),
        },
      ]
      ;(NotificationModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockNotifications),
          }),
        }),
      })

      await sendPendingNotifications(mockSocket)

      expect(NotificationModel.find).toHaveBeenCalledWith({ user: 'test-user-id', is_read: false })
      expect(mockSocket.emit).toHaveBeenCalledWith(
        SocketEvent.NOTIFICATION,
        expect.objectContaining({ _id: 'n1' }),
      )
    })
  })

  describe('pushNotification', () => {
    it('should create notification and emit to user room', async () => {
      const mockIO = createMockIO() as any
      const mockSavedNotification = {
        _id: { toString: () => 'new-notif' },
        title: 'New Order',
        content: 'Your order is confirmed',
        type: 'order',
        link: '/orders/123',
        createdAt: new Date('2024-01-01'),
      }
      ;(NotificationModel.create as jest.Mock).mockResolvedValue(mockSavedNotification)

      await pushNotification(mockIO, 'user-123', {
        title: 'New Order',
        content: 'Your order is confirmed',
        type: 'order',
        link: '/orders/123',
      })

      expect(NotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user-123',
          title: 'New Order',
          is_read: false,
        }),
      )
      expect(mockIO.to).toHaveBeenCalledWith('user:user-123')
    })
  })
})
