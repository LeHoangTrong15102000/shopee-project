/// <reference types="jest" />

const mockGpsFindOne = jest.fn()
const mockGpsCreate = jest.fn()
const mockGetIO = jest.fn()

jest.mock('@database/models/gps-tracking.model', () => ({
  GpsTrackingUpdateModel: {
    findOne: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      lean: mockGpsFindOne,
    })),
    create: mockGpsCreate,
  },
}))

jest.mock('../../socket/socket.init', () => ({
  getIO: mockGetIO,
}))

import { GpsTrackingService } from '@services/gps-tracking.service'

const VALID_ORDER_ID = '507f1f77bcf86cd799439011'
const INVALID_ORDER_ID = 'not-an-id'

describe('GpsTrackingService', () => {
  let service: GpsTrackingService

  beforeEach(() => {
    service = new GpsTrackingService()
    jest.clearAllMocks()
  })

  describe('getOrderTracking', () => {
    it('throws ValidationError for invalid orderId', async () => {
      await expect(service.getOrderTracking(INVALID_ORDER_ID)).rejects.toThrow('Invalid order id')
    })

    it('throws NotFoundError when no tracking found', async () => {
      mockGpsFindOne.mockResolvedValue(null)

      await expect(service.getOrderTracking(VALID_ORDER_ID)).rejects.toThrow()
    })

    it('returns latest tracking record sorted by timestamp desc', async () => {
      const tracking = {
        _id: 't1',
        orderId: VALID_ORDER_ID,
        status: 'in_transit',
        location: { lat: 10.7, lng: 106.7 },
        timestamp: new Date(),
      }
      mockGpsFindOne.mockResolvedValue(tracking)

      const result = await service.getOrderTracking(VALID_ORDER_ID)

      expect(result).toEqual(tracking)
    })
  })

  describe('updateTracking', () => {
    it('throws ValidationError for invalid orderId', async () => {
      await expect(
        service.updateTracking(INVALID_ORDER_ID, {
          status: 'in_transit',
          location: { lat: 10.7, lng: 106.7 },
          driverName: 'John',
          driverPhone: '0901234567',
          vehicleInfo: 'Bike',
          estimatedArrival: new Date(),
        }),
      ).rejects.toThrow('Invalid order id')
    })

    it('creates a new tracking record (append-only)', async () => {
      const created = {
        _id: 't2',
        orderId: VALID_ORDER_ID,
        status: 'in_transit',
        toObject: jest.fn().mockReturnValue({ _id: 't2', orderId: VALID_ORDER_ID }),
      }
      mockGpsCreate.mockResolvedValue(created)
      mockGetIO.mockReturnValue(null)

      const data = {
        status: 'in_transit',
        location: { lat: 10.7, lng: 106.7 },
        driverName: 'John',
        driverPhone: '0901234567',
        vehicleInfo: 'Bike',
        estimatedArrival: new Date(),
      }

      await service.updateTracking(VALID_ORDER_ID, data)

      expect(mockGpsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_transit',
          location: { lat: 10.7, lng: 106.7 },
        }),
      )
    })

    it('emits tracking:update WebSocket event to order room', async () => {
      const mockEmit = jest.fn()
      const mockTo = jest.fn().mockReturnValue({ emit: mockEmit })
      const mockIo = { to: mockTo }

      const created = {
        _id: 't3',
        orderId: VALID_ORDER_ID,
        toObject: jest.fn().mockReturnValue({ _id: 't3' }),
      }
      mockGpsCreate.mockResolvedValue(created)
      mockGetIO.mockReturnValue(mockIo)

      await service.updateTracking(VALID_ORDER_ID, {
        status: 'delivered',
        location: { lat: 10.7, lng: 106.7 },
        driverName: 'Jane',
        driverPhone: '0901234568',
        vehicleInfo: 'Car',
        estimatedArrival: new Date(),
      })

      expect(mockTo).toHaveBeenCalledWith(`order:${VALID_ORDER_ID}`)
      expect(mockEmit).toHaveBeenCalledWith('tracking:update', expect.any(Object))
    })

    it('does not throw when IO is null (no WebSocket)', async () => {
      const created = {
        _id: 't4',
        orderId: VALID_ORDER_ID,
        toObject: jest.fn().mockReturnValue({ _id: 't4' }),
      }
      mockGpsCreate.mockResolvedValue(created)
      mockGetIO.mockReturnValue(null)

      await expect(
        service.updateTracking(VALID_ORDER_ID, {
          status: 'in_transit',
          location: { lat: 10.7, lng: 106.7 },
          driverName: 'John',
          driverPhone: '0901234567',
          vehicleInfo: 'Bike',
          estimatedArrival: new Date(),
        }),
      ).resolves.not.toThrow()
    })
  })
})
