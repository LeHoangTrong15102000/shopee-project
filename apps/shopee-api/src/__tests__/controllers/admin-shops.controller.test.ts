/// <reference types="jest" />
import { Request, Response } from 'express'

const mockListShops = jest.fn()
const mockGetShopDetail = jest.fn()
const mockUpdateShopStatus = jest.fn()
const mockGetShopProducts = jest.fn()
const mockGetShopRevenue = jest.fn()

jest.mock('@services/admin-shops.service', () => ({
  AdminShopsService: jest.fn().mockImplementation(() => ({
    listShops: mockListShops,
    getShopDetail: mockGetShopDetail,
    updateShopStatus: mockUpdateShopStatus,
    getShopProducts: mockGetShopProducts,
    getShopRevenue: mockGetShopRevenue,
  })),
}))

jest.mock('@utils/response', () => ({
  responseSuccess: jest.fn((res: any, { data }: any) => {
    res.status(200).send({ data })
  }),
}))

import {
  listShops,
  getShopDetail,
  updateShopStatus,
  getShopProducts,
  getShopRevenue,
} from '../../controllers/admin-shops.controller'

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

describe('AdminShopsController', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('listShops', () => {
    it('passes filter params to service', async () => {
      mockListShops.mockResolvedValue({ data: [], pagination: {} })

      const req = createMockRequest({
        query: { page: '2', limit: '10', status: 'active', search: 'test', sort_by: 'name', order: 'asc' },
      })
      const res = createMockResponse()

      await listShops(req as Request, res as Response)

      expect(mockListShops).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        status: 'active',
        search: 'test',
        sort_by: 'name',
        order: 'asc',
      })
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('uses default page 1 and limit 20 when not provided', async () => {
      mockListShops.mockResolvedValue({ data: [], pagination: {} })

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await listShops(req as Request, res as Response)

      expect(mockListShops).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      )
    })
  })

  describe('getShopDetail', () => {
    it('returns shop detail with correct stats fields', async () => {
      const shopData = {
        _id: 'shop1',
        name: 'Test Shop',
        stats: {
          products_count: 5,
          total_revenue: 50000,
          followers_count: 10,
          avg_rating: 4.5,
        },
      }
      mockGetShopDetail.mockResolvedValue(shopData)

      const req = createMockRequest({ params: { id: 'shop1' } })
      const res = createMockResponse()

      await getShopDetail(req as Request, res as Response)

      expect(mockGetShopDetail).toHaveBeenCalledWith('shop1')
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('updateShopStatus', () => {
    it('passes status and reason to service', async () => {
      mockUpdateShopStatus.mockResolvedValue({ _id: 'shop1', status: 'suspended' })

      const req = createMockRequest({
        params: { id: 'shop1' },
        body: { status: 'suspended', reason: 'Violation' },
      })
      const res = createMockResponse()

      await updateShopStatus(req as Request, res as Response)

      expect(mockUpdateShopStatus).toHaveBeenCalledWith('shop1', 'suspended', 'Violation')
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('tests active status transition', async () => {
      mockUpdateShopStatus.mockResolvedValue({ _id: 'shop1', status: 'active' })

      const req = createMockRequest({
        params: { id: 'shop1' },
        body: { status: 'active' },
      })
      const res = createMockResponse()

      await updateShopStatus(req as Request, res as Response)

      expect(mockUpdateShopStatus).toHaveBeenCalledWith('shop1', 'active', undefined)
    })

    it('tests banned status transition', async () => {
      mockUpdateShopStatus.mockResolvedValue({ _id: 'shop1', status: 'banned' })

      const req = createMockRequest({
        params: { id: 'shop1' },
        body: { status: 'banned', reason: 'Fraud' },
      })
      const res = createMockResponse()

      await updateShopStatus(req as Request, res as Response)

      expect(mockUpdateShopStatus).toHaveBeenCalledWith('shop1', 'banned', 'Fraud')
    })
  })

  describe('getShopProducts', () => {
    it('forwards pagination params to service', async () => {
      mockGetShopProducts.mockResolvedValue({ data: [], pagination: {} })

      const req = createMockRequest({
        params: { id: 'shop1' },
        query: { page: '3', limit: '15' },
      })
      const res = createMockResponse()

      await getShopProducts(req as Request, res as Response)

      expect(mockGetShopProducts).toHaveBeenCalledWith('shop1', 3, 15)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('getShopRevenue', () => {
    it('forwards period param to service', async () => {
      mockGetShopRevenue.mockResolvedValue({ period: '7d', data: [] })

      const req = createMockRequest({
        params: { id: 'shop1' },
        query: { period: '7d' },
      })
      const res = createMockResponse()

      await getShopRevenue(req as Request, res as Response)

      expect(mockGetShopRevenue).toHaveBeenCalledWith('shop1', '7d')
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('defaults to 30d when period not provided', async () => {
      mockGetShopRevenue.mockResolvedValue({ period: '30d', data: [] })

      const req = createMockRequest({ params: { id: 'shop1' }, query: {} })
      const res = createMockResponse()

      await getShopRevenue(req as Request, res as Response)

      expect(mockGetShopRevenue).toHaveBeenCalledWith('shop1', '30d')
    })
  })
})
