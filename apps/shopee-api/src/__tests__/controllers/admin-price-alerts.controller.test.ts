/// <reference types="jest" />
import { Request, Response } from 'express'

const mockAdminGetAlerts = jest.fn()
const mockAdminGetAlertStats = jest.fn()
const mockAdminDeleteAlert = jest.fn()

jest.mock('../../container', () => ({
  container: {
    services: {
      price: {
        adminGetAlerts: mockAdminGetAlerts,
        adminGetAlertStats: mockAdminGetAlertStats,
        adminDeleteAlert: mockAdminDeleteAlert,
      },
      checkin: {},
    },
  },
}))

jest.mock('@utils/response', () => ({
  responseSuccess: jest.fn((res: any, { data }: any = {}) => {
    res.status(200).send({ data })
  }),
}))

import {
  adminGetPriceAlerts,
  adminGetPriceAlertStats,
  adminDeletePriceAlert,
} from '../../controllers/admin-price-alerts.controller'
import { NotFoundError } from '@services/base.service'

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('AdminPriceAlertsController', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('adminGetPriceAlerts', () => {
    it('forwards filter and pagination params to service', async () => {
      mockAdminGetAlerts.mockResolvedValue({ data: [], pagination: {} })

      const req = createMockRequest({
        query: { page: '2', limit: '10', user_id: 'u1', product_id: 'p1', status: 'active' },
      })
      const res = createMockResponse()

      await adminGetPriceAlerts(req as Request, res as Response)

      expect(mockAdminGetAlerts).toHaveBeenCalledWith(
        { user_id: 'u1', product_id: 'p1', status: 'active' },
        { page: 2, limit: 10 },
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('uses default page 1 and limit 20 when not provided', async () => {
      mockAdminGetAlerts.mockResolvedValue({ data: [], pagination: {} })

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await adminGetPriceAlerts(req as Request, res as Response)

      expect(mockAdminGetAlerts).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ page: 1, limit: 20 }),
      )
    })
  })

  describe('adminGetPriceAlertStats', () => {
    it('calls service and returns 200', async () => {
      mockAdminGetAlertStats.mockResolvedValue({
        total: 100,
        active: 80,
        triggered: 20,
      })

      const req = createMockRequest()
      const res = createMockResponse()

      await adminGetPriceAlertStats(req as Request, res as Response)

      expect(mockAdminGetAlertStats).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('adminDeletePriceAlert', () => {
    it('passes alert id to service and returns 200', async () => {
      mockAdminDeleteAlert.mockResolvedValue({ _id: 'alert1' })

      const req = createMockRequest({ params: { id: 'alert1' } })
      const res = createMockResponse()

      await adminDeletePriceAlert(req as Request, res as Response)

      expect(mockAdminDeleteAlert).toHaveBeenCalledWith('alert1')
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('propagates NotFoundError when alert does not exist', async () => {
      mockAdminDeleteAlert.mockRejectedValue(new NotFoundError('PriceAlert', 'nonexistent-id'))

      const req = createMockRequest({ params: { id: 'nonexistent-id' } })
      const res = createMockResponse()

      await expect(adminDeletePriceAlert(req as Request, res as Response)).rejects.toThrow(
        NotFoundError,
      )
      expect(mockAdminDeleteAlert).toHaveBeenCalledWith('nonexistent-id')
    })
  })
})
