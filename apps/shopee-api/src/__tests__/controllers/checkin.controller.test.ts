/// <reference types="jest" />
import { Request, Response } from 'express'

jest.mock('../../container', () => ({
  container: {
    services: {
      checkin: {
        checkIn: jest.fn(),
        getStreak: jest.fn(),
        getHistory: jest.fn(),
      },
    },
  },
}))

const { container } = require('../../container')
import { checkIn, getStreak, getHistory } from '../../controllers/checkin.controller'

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  jwtDecoded: options.jwtDecoded || { id: 'user123' },
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Checkin Controller', () => {
  beforeEach(() => jest.clearAllMocks())

  it('checkIn success', async () => {
    const mockData = { streak: 5, coins_earned: 10 }
    container.services.checkin.checkIn.mockResolvedValue(mockData)
    const req = createMockRequest()
    const res = createMockResponse()
    await checkIn(req as Request, res as Response)
    expect(container.services.checkin.checkIn).toHaveBeenCalledWith('user123')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: expect.any(String), data: mockData })
  })

  it('checkIn throws on error', async () => {
    container.services.checkin.checkIn.mockRejectedValue(new Error('Already checked in'))
    const req = createMockRequest()
    const res = createMockResponse()
    await expect(checkIn(req as Request, res as Response)).rejects.toThrow()
  })

  it('getStreak success', async () => {
    const mockData = { current_streak: 7, longest_streak: 15 }
    container.services.checkin.getStreak.mockResolvedValue(mockData)
    const req = createMockRequest()
    const res = createMockResponse()
    await getStreak(req as Request, res as Response)
    expect(container.services.checkin.getStreak).toHaveBeenCalledWith('user123')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: expect.any(String), data: mockData })
  })

  it('getHistory with pagination (Number conversion)', async () => {
    const mockResult = {
      data: [{ date: '2026-03-16' }],
      pagination: { page: 1, limit: 10, total: 50, page_size: 5 },
    }
    container.services.checkin.getHistory.mockResolvedValue(mockResult)
    const req = createMockRequest({ query: { page: '1', limit: '10' } })
    const res = createMockResponse()
    await getHistory(req as Request, res as Response)
    // Controller does Number(page), Number(limit)
    expect(container.services.checkin.getHistory).toHaveBeenCalledWith('user123', {
      page: 1,
      limit: 10,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: expect.any(String),
      data: {
        history: mockResult.data,
        pagination: { page: 1, limit: 10, total: 50, total_pages: 5 },
      },
    })
  })

  it('getHistory throws on error', async () => {
    container.services.checkin.getHistory.mockRejectedValue(new Error('DB error'))
    const req = createMockRequest({ query: {} })
    const res = createMockResponse()
    await expect(getHistory(req as Request, res as Response)).rejects.toThrow()
  })
})
