/// <reference types="jest" />
import { Request, Response } from 'express'

jest.mock('../../container', () => ({
  voucherService: {
    adminGetVouchers: jest.fn(),
    adminGetById: jest.fn(),
    adminCreate: jest.fn(),
    adminUpdate: jest.fn(),
    adminDelete: jest.fn(),
    adminToggle: jest.fn(),
    adminGetUsage: jest.fn(),
    adminGetStats: jest.fn(),
  },
}))

import { voucherService } from '../../container'
import {
  adminGetVouchers,
  adminGetVoucherById,
  adminCreateVoucher,
  adminUpdateVoucher,
  adminDeleteVoucher,
  adminToggleVoucher,
  adminGetVoucherUsage,
  adminGetVoucherStats,
} from '../../controllers/admin-voucher.controller'
import { ValidationError, NotFoundError } from '@services/base.service'

const mockVoucherService = voucherService as jest.Mocked<typeof voucherService>

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

describe('Admin Voucher Controller', () => {
  beforeEach(() => jest.clearAllMocks())

  it('adminGetVouchers with filters', async () => {
    ;(mockVoucherService.adminGetVouchers as jest.Mock).mockResolvedValue({ data: [] })
    const req = createMockRequest({
      query: {
        page: '2',
        limit: '10',
        is_active: 'true',
        discount_type: 'percentage',
        status: 'active',
        search: 'test',
        sort_by: 'created_at',
        order: 'desc',
      },
    })
    const res = createMockResponse()
    await adminGetVouchers(req as Request, res as Response)
    expect(mockVoucherService.adminGetVouchers).toHaveBeenCalledWith(
      { is_active: 'true', discount_type: 'percentage', status: 'active', search: 'test' },
      { page: 2, limit: 10, sort_by: 'created_at', order: 'desc' },
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('adminGetVoucherById success', async () => {
    ;(mockVoucherService.adminGetById as jest.Mock).mockResolvedValue({ code: 'TEST' })
    const req = createMockRequest({ params: { id: 'v1' } })
    const res = createMockResponse()
    await adminGetVoucherById(req as Request, res as Response)
    expect(mockVoucherService.adminGetById).toHaveBeenCalledWith('v1')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminGetVoucherById throws on NotFoundError', async () => {
    ;(mockVoucherService.adminGetById as jest.Mock).mockRejectedValue(new NotFoundError('Voucher'))
    const req = createMockRequest({ params: { id: 'x' } })
    const res = createMockResponse()
    await expect(adminGetVoucherById(req as Request, res as Response)).rejects.toThrow()
  })

  it('adminCreateVoucher success', async () => {
    ;(mockVoucherService.adminCreate as jest.Mock).mockResolvedValue({ code: 'NEW' })
    const req = createMockRequest({ body: { code: 'NEW', discount_value: 10 } })
    const res = createMockResponse()
    await adminCreateVoucher(req as Request, res as Response)
    expect(mockVoucherService.adminCreate).toHaveBeenCalledWith({ code: 'NEW', discount_value: 10 })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminCreateVoucher throws on ValidationError', async () => {
    ;(mockVoucherService.adminCreate as jest.Mock).mockRejectedValue(new ValidationError('Invalid'))
    const req = createMockRequest({ body: {} })
    const res = createMockResponse()
    await expect(adminCreateVoucher(req as Request, res as Response)).rejects.toThrow()
  })

  it('adminUpdateVoucher success', async () => {
    ;(mockVoucherService.adminUpdate as jest.Mock).mockResolvedValue({ discount_value: 20 })
    const req = createMockRequest({ params: { id: 'v1' }, body: { discount_value: 20 } })
    const res = createMockResponse()
    await adminUpdateVoucher(req as Request, res as Response)
    expect(mockVoucherService.adminUpdate).toHaveBeenCalledWith('v1', { discount_value: 20 })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminDeleteVoucher success', async () => {
    ;(mockVoucherService.adminDelete as jest.Mock).mockResolvedValue(undefined)
    const req = createMockRequest({ params: { id: 'v1' } })
    const res = createMockResponse()
    await adminDeleteVoucher(req as Request, res as Response)
    expect(mockVoucherService.adminDelete).toHaveBeenCalledWith('v1')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminToggleVoucher success', async () => {
    ;(mockVoucherService.adminToggle as jest.Mock).mockResolvedValue({ is_active: false })
    const req = createMockRequest({ params: { id: 'v1' } })
    const res = createMockResponse()
    await adminToggleVoucher(req as Request, res as Response)
    expect(mockVoucherService.adminToggle).toHaveBeenCalledWith('v1')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminGetVoucherUsage success', async () => {
    ;(mockVoucherService.adminGetUsage as jest.Mock).mockResolvedValue({ data: [] })
    const req = createMockRequest({ params: { id: 'v1' }, query: { page: '2', limit: '5' } })
    const res = createMockResponse()
    await adminGetVoucherUsage(req as Request, res as Response)
    expect(mockVoucherService.adminGetUsage).toHaveBeenCalledWith('v1', { page: 2, limit: 5 })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminGetVoucherStats success', async () => {
    ;(mockVoucherService.adminGetStats as jest.Mock).mockResolvedValue({ total: 100 })
    const res = createMockResponse()
    await adminGetVoucherStats(createMockRequest() as Request, res as Response)
    expect(mockVoucherService.adminGetStats).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  // Cover the handleError fallthrough (line 14) — re-throw unknown errors
  it('adminGetVoucherById rethrows unknown errors', async () => {
    ;(mockVoucherService.adminGetById as jest.Mock).mockRejectedValue(new Error('Unknown'))
    const req = createMockRequest({ params: { id: 'x' } })
    const res = createMockResponse()
    await expect(adminGetVoucherById(req as Request, res as Response)).rejects.toThrow('Unknown')
  })

  it('adminUpdateVoucher rethrows unknown errors', async () => {
    ;(mockVoucherService.adminUpdate as jest.Mock).mockRejectedValue(new Error('DB failure'))
    const req = createMockRequest({ params: { id: 'v1' }, body: {} })
    const res = createMockResponse()
    await expect(adminUpdateVoucher(req as Request, res as Response)).rejects.toThrow('DB failure')
  })

  it('adminDeleteVoucher rethrows unknown errors', async () => {
    ;(mockVoucherService.adminDelete as jest.Mock).mockRejectedValue(new Error('Delete error'))
    const req = createMockRequest({ params: { id: 'v1' } })
    const res = createMockResponse()
    await expect(adminDeleteVoucher(req as Request, res as Response)).rejects.toThrow('Delete error')
  })

  it('adminToggleVoucher rethrows unknown errors', async () => {
    ;(mockVoucherService.adminToggle as jest.Mock).mockRejectedValue(new Error('Toggle error'))
    const req = createMockRequest({ params: { id: 'v1' } })
    const res = createMockResponse()
    await expect(adminToggleVoucher(req as Request, res as Response)).rejects.toThrow('Toggle error')
  })

  it('adminGetVoucherUsage rethrows unknown errors', async () => {
    ;(mockVoucherService.adminGetUsage as jest.Mock).mockRejectedValue(new Error('Usage error'))
    const req = createMockRequest({ params: { id: 'v1' }, query: {} })
    const res = createMockResponse()
    await expect(adminGetVoucherUsage(req as Request, res as Response)).rejects.toThrow(
      'Usage error',
    )
  })
})
