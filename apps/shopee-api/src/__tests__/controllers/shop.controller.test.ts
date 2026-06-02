/// <reference types="jest" />
import { Request, Response } from 'express'

const mockGetShop = jest.fn()
const mockGetShopProducts = jest.fn()
const mockFollowShop = jest.fn()
const mockUnfollowShop = jest.fn()

jest.mock('@services/shop.service', () => ({
  ShopService: jest.fn().mockImplementation(() => ({
    getShop: mockGetShop,
    getShopProducts: mockGetShopProducts,
    followShop: mockFollowShop,
    unfollowShop: mockUnfollowShop,
  })),
}))

import {
  getShop,
  getShopProducts,
  followShop,
  unfollowShop,
} from '../../controllers/shop.controller'

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  jwtDecoded: options.jwtDecoded,
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('ShopController', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getShop', () => {
    it('delegates to shopService.getShop and returns 200', async () => {
      const shopData = { _id: 'shop1', name: 'Test Shop', isFollowing: false }
      mockGetShop.mockResolvedValue(shopData)

      const req = createMockRequest({ params: { id: 'shop1' } })
      const res = createMockResponse()

      await getShop(req as Request, res as Response)

      expect(mockGetShop).toHaveBeenCalledWith('shop1', undefined)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: shopData }))
    })

    it('passes userId from jwtDecoded to service', async () => {
      mockGetShop.mockResolvedValue({ _id: 'shop1', isFollowing: true })

      const req = createMockRequest({
        params: { id: 'shop1' },
        jwtDecoded: { id: 'user123' },
      })
      const res = createMockResponse()

      await getShop(req as Request, res as Response)

      expect(mockGetShop).toHaveBeenCalledWith('shop1', 'user123')
    })
  })

  describe('getShopProducts', () => {
    it('delegates to shopService.getShopProducts with pagination and sort', async () => {
      const productsData = { data: [], total: 0, page: 2, limit: 10 }
      mockGetShopProducts.mockResolvedValue(productsData)

      const req = createMockRequest({
        params: { id: 'shop1' },
        query: { page: '2', limit: '10', sort: 'price' },
      })
      const res = createMockResponse()

      await getShopProducts(req as Request, res as Response)

      expect(mockGetShopProducts).toHaveBeenCalledWith('shop1', 2, 10, 'price')
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('uses default pagination when no query params', async () => {
      mockGetShopProducts.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })

      const req = createMockRequest({ params: { id: 'shop1' } })
      const res = createMockResponse()

      await getShopProducts(req as Request, res as Response)

      expect(mockGetShopProducts).toHaveBeenCalledWith('shop1', 1, 20, 'createdAt')
    })
  })

  describe('followShop', () => {
    it('delegates to shopService.followShop and returns 204', async () => {
      mockFollowShop.mockResolvedValue(undefined)

      const req = createMockRequest({
        params: { id: 'shop1' },
        jwtDecoded: { id: 'user123' },
      })
      const res = createMockResponse()

      await followShop(req as Request, res as Response)

      expect(mockFollowShop).toHaveBeenCalledWith('shop1', 'user123')
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })

    it('requires auth (jwtDecoded.id is used)', async () => {
      mockFollowShop.mockResolvedValue(undefined)

      const req = createMockRequest({
        params: { id: 'shop1' },
        jwtDecoded: { id: 'user456' },
      })
      const res = createMockResponse()

      await followShop(req as Request, res as Response)

      expect(mockFollowShop).toHaveBeenCalledWith('shop1', 'user456')
    })
  })

  describe('unfollowShop', () => {
    it('delegates to shopService.unfollowShop and returns 204', async () => {
      mockUnfollowShop.mockResolvedValue(undefined)

      const req = createMockRequest({
        params: { id: 'shop1' },
        jwtDecoded: { id: 'user123' },
      })
      const res = createMockResponse()

      await unfollowShop(req as Request, res as Response)

      expect(mockUnfollowShop).toHaveBeenCalledWith('shop1', 'user123')
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })

    it('requires auth (jwtDecoded.id is used)', async () => {
      mockUnfollowShop.mockResolvedValue(undefined)

      const req = createMockRequest({
        params: { id: 'shop1' },
        jwtDecoded: { id: 'user789' },
      })
      const res = createMockResponse()

      await unfollowShop(req as Request, res as Response)

      expect(mockUnfollowShop).toHaveBeenCalledWith('shop1', 'user789')
    })
  })
})
