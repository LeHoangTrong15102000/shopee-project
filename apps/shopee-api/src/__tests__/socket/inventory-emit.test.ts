/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

jest.mock('@database/models/user.model', () => ({
  UserModel: {
    find: jest.fn(),
  },
}))

jest.mock('@database/models/notification.model', () => ({
  NotificationModel: {
    insertMany: jest.fn(),
  },
}))

jest.mock('@constants/role.enum', () => ({
  ROLE: { ADMIN: 'Admin', USER: 'User' },
}))

const ROOM_PREFIX_ADMIN = 'admin:'
const SocketEvent = {
  INVENTORY_ALERT: 'inventory_alert',
}

describe('Inventory Emit Utils', () => {
  let mockIO: any
  let mockEmit: jest.Mock

  const setupMockIO = () => {
    mockEmit = jest.fn()
    mockIO = {
      to: jest.fn().mockReturnValue({
        emit: mockEmit,
      }),
    }
  }

  const setupMock = async (throwError = false) => {
    jest.resetModules()
    setupMockIO()
    const { getIORequired } = await import('../../socket/socket.init')
    if (throwError) {
      ;(getIORequired as jest.Mock).mockImplementation(() => {
        throw new Error('IO not initialized')
      })
    } else {
      ;(getIORequired as jest.Mock).mockReturnValue(mockIO)
    }
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('emitInventoryAlert', () => {
    it('should emit INVENTORY_ALERT to admin:notifications room', async () => {
      await setupMock()
      const { emitInventoryAlert } = await import('../../socket/utils/inventory-emit')

      emitInventoryAlert('product-123', 'Test Product', 5, 10)

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_ADMIN}notifications`)
      expect(mockEmit).toHaveBeenCalledWith(
        SocketEvent.INVENTORY_ALERT,
        expect.objectContaining({
          product_id: 'product-123',
          product_name: 'Test Product',
          current_quantity: 5,
          threshold: 10,
        }),
      )
    })

    it('should set severity to warning when currentQuantity > 0', async () => {
      await setupMock()
      const { emitInventoryAlert } = await import('../../socket/utils/inventory-emit')

      emitInventoryAlert('product-456', 'Low Stock Product', 3, 10)

      expect(mockEmit).toHaveBeenCalledWith(
        SocketEvent.INVENTORY_ALERT,
        expect.objectContaining({
          severity: 'warning',
        }),
      )
    })

    it('should set severity to critical when currentQuantity === 0', async () => {
      await setupMock()
      const { emitInventoryAlert } = await import('../../socket/utils/inventory-emit')

      emitInventoryAlert('product-789', 'Out of Stock Product', 0, 10)

      expect(mockEmit).toHaveBeenCalledWith(
        SocketEvent.INVENTORY_ALERT,
        expect.objectContaining({
          severity: 'critical',
        }),
      )
    })

    it('should handle error gracefully when getIORequired throws', async () => {
      await setupMock(true)
      const { emitInventoryAlert } = await import('../../socket/utils/inventory-emit')

      expect(() => emitInventoryAlert('product-err', 'Error Product', 5, 10)).not.toThrow()
      expect(mockIO.to).not.toHaveBeenCalled()
    })

    it('should persist notifications for admin users', async () => {
      await setupMock()
      const { UserModel } = await import('@database/models/user.model')
      const { NotificationModel } = await import('@database/models/notification.model')
      const mockAdminUsers = [{ _id: 'admin-1' }, { _id: 'admin-2' }]
      ;(UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockAdminUsers),
        }),
      })

      const { emitInventoryAlert } = await import('../../socket/utils/inventory-emit')

      emitInventoryAlert('product-persist', 'Persist Product', 2, 10)

      await new Promise((resolve) => setImmediate(resolve))

      expect(UserModel.find).toHaveBeenCalledWith({ roles: 'Admin' })
      expect(NotificationModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user: 'admin-1',
            type: 'system',
            is_read: false,
          }),
          expect.objectContaining({
            user: 'admin-2',
            type: 'system',
            is_read: false,
          }),
        ]),
      )
    })
  })
})
