/// <reference types="jest" />
import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'

jest.mock('../../container', () => ({
  orderService: {
    getShippingMethods: jest.fn(),
    createOrder: jest.fn(),
  },
  purchaseService: {
    getCartItemsByIds: jest.fn(),
  },
  addressService: {
    getDefaultAddress: jest.fn(),
  },
  loyaltyService: {
    getPoints: jest.fn(),
    deductPoints: jest.fn(),
  },
  voucherService: {
    applyVoucher: jest.fn(),
    getVoucherByCode: jest.fn(),
    useVoucher: jest.fn(),
  },
}))

import { orderService, purchaseService, addressService, loyaltyService, voucherService } from '../../container'
import { getCheckoutSummary, createCheckoutOrder } from '@controllers/checkout.controller'

const mockOrderService = orderService as jest.Mocked<typeof orderService>
const mockPurchaseService = purchaseService as jest.Mocked<typeof purchaseService>
const mockAddressService = addressService as jest.Mocked<typeof addressService>
const mockLoyaltyService = loyaltyService as jest.Mocked<typeof loyaltyService>
const mockVoucherService = voucherService as jest.Mocked<typeof voucherService>

const createMockRequest = (options: { body?: any; params?: any; query?: any; jwtDecoded?: any } = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  jwtDecoded: options.jwtDecoded || { id: 'user_1', email: 'test@example.com', roles: ['User'], created_at: new Date().toISOString() },
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockProduct = {
  _id: 'product_1',
  name: 'Test Product',
  image: 'image.jpg',
  price: 100000,
  price_before_discount: 120000,
}

const mockPurchase = {
  _id: 'purchase_1',
  product: mockProduct,
  buy_count: 2,
}

const mockShippingMethods = [
  { id: 'standard', name: 'Giao hàng tiêu chuẩn', price: 30000 },
  { id: 'express', name: 'Giao hàng nhanh', price: 50000 },
]

const mockAddress = {
  _id: 'addr_1',
  full_name: 'John Doe',
  phone: '0123456789',
  province: 'Ho Chi Minh',
  district: 'District 1',
  ward: 'Ward 1',
  street: '123 Main St',
  is_default: true,
}

describe('Checkout Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCheckoutSummary', () => {
    it('should return checkout summary successfully', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([mockPurchase] as any)
      mockOrderService.getShippingMethods.mockReturnValue(mockShippingMethods as any)
      mockLoyaltyService.getPoints.mockResolvedValue({ points: { available_points: 500 } } as any)
      mockAddressService.getDefaultAddress.mockResolvedValue(mockAddress as any)

      const req = createMockRequest({ body: { purchase_ids: ['purchase_1'] } })
      const res = createMockResponse()

      await getCheckoutSummary(req as Request, res as Response)

      expect(mockPurchaseService.getCartItemsByIds).toHaveBeenCalledWith('user_1', ['purchase_1'])
      expect(mockOrderService.getShippingMethods).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw BAD_REQUEST when cart is empty', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([])

      const req = createMockRequest({ body: { purchase_ids: [] } })
      const res = createMockResponse()

      await expect(getCheckoutSummary(req as Request, res as Response))
        .rejects.toMatchObject({ status: STATUS.BAD_REQUEST })
    })

    it('should apply voucher discount when voucher_code is provided', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([mockPurchase] as any)
      mockOrderService.getShippingMethods.mockReturnValue(mockShippingMethods as any)
      mockVoucherService.applyVoucher.mockResolvedValue({ code: 'DISCOUNT10', discount_amount: 10000 } as any)
      mockLoyaltyService.getPoints.mockResolvedValue({ points: { available_points: 0 } } as any)
      mockAddressService.getDefaultAddress.mockResolvedValue(mockAddress as any)

      const req = createMockRequest({ body: { purchase_ids: ['purchase_1'], voucher_code: 'DISCOUNT10' } })
      const res = createMockResponse()

      await getCheckoutSummary(req as Request, res as Response)

      expect(mockVoucherService.applyVoucher).toHaveBeenCalledWith({ code: 'DISCOUNT10', order_value: 200000 })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should apply loyalty coins discount when coins_used is provided', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([mockPurchase] as any)
      mockOrderService.getShippingMethods.mockReturnValue(mockShippingMethods as any)
      mockLoyaltyService.getPoints.mockResolvedValue({ points: { available_points: 500 } } as any)
      mockAddressService.getDefaultAddress.mockResolvedValue(mockAddress as any)

      const req = createMockRequest({ body: { purchase_ids: ['purchase_1'], coins_used: 100 } })
      const res = createMockResponse()

      await getCheckoutSummary(req as Request, res as Response)

      expect(mockLoyaltyService.getPoints).toHaveBeenCalledWith('user_1')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should continue without discount when voucher is invalid', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([mockPurchase] as any)
      mockOrderService.getShippingMethods.mockReturnValue(mockShippingMethods as any)
      mockVoucherService.applyVoucher.mockRejectedValue(new Error('Invalid voucher'))
      mockLoyaltyService.getPoints.mockResolvedValue({ points: { available_points: 0 } } as any)
      mockAddressService.getDefaultAddress.mockResolvedValue(mockAddress as any)

      const req = createMockRequest({ body: { purchase_ids: ['purchase_1'], voucher_code: 'INVALID' } })
      const res = createMockResponse()

      await getCheckoutSummary(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw BAD_REQUEST on ValidationError', async () => {
      mockPurchaseService.getCartItemsByIds.mockRejectedValue(new ValidationError('Invalid purchase ids'))

      const req = createMockRequest({ body: { purchase_ids: ['invalid'] } })
      const res = createMockResponse()

      await expect(getCheckoutSummary(req as Request, res as Response))
        .rejects.toMatchObject({ status: STATUS.BAD_REQUEST })
    })
  })

  describe('createCheckoutOrder', () => {
    const mockOrder = {
      _id: 'order_1',
      user: 'user_1',
      items: [{ product_id: 'product_1', buy_count: 2, price: 100000 }],
      total_amount: 230000,
      status: 'pending',
    }

    it('should create order successfully', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([mockPurchase] as any)
      mockOrderService.createOrder.mockResolvedValue(mockOrder as any)

      const req = createMockRequest({
        body: {
          purchase_ids: ['purchase_1'],
          shipping_address_id: 'addr_1',
          shipping_method_id: 'standard',
          payment_method: 'cod',
        },
      })
      const res = createMockResponse()

      await createCheckoutOrder(req as Request, res as Response)

      expect(mockOrderService.createOrder).toHaveBeenCalledWith('user_1', expect.objectContaining({
        items: [{ product_id: 'product_1', buy_count: 2 }],
        shipping_address_id: 'addr_1',
      }))
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw BAD_REQUEST when cart is empty', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([])

      const req = createMockRequest({ body: { purchase_ids: [] } })
      const res = createMockResponse()

      await expect(createCheckoutOrder(req as Request, res as Response))
        .rejects.toMatchObject({ status: STATUS.BAD_REQUEST })
    })

    it('should use voucher when voucher_code is provided', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([mockPurchase] as any)
      mockOrderService.createOrder.mockResolvedValue(mockOrder as any)
      mockVoucherService.getVoucherByCode.mockResolvedValue({
        voucher: { _id: 'voucher_1' },
        status: { is_valid: true },
      } as any)
      mockVoucherService.useVoucher.mockResolvedValue(undefined as any)

      const req = createMockRequest({
        body: {
          purchase_ids: ['purchase_1'],
          shipping_address_id: 'addr_1',
          shipping_method_id: 'standard',
          payment_method: 'cod',
          voucher_code: 'DISCOUNT10',
        },
      })
      const res = createMockResponse()

      await createCheckoutOrder(req as Request, res as Response)

      expect(mockVoucherService.getVoucherByCode).toHaveBeenCalledWith('DISCOUNT10')
      expect(mockVoucherService.useVoucher).toHaveBeenCalledWith('user_1', 'voucher_1', 'order_1')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should deduct coins when coins_used is provided', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([mockPurchase] as any)
      mockOrderService.createOrder.mockResolvedValue(mockOrder as any)
      mockLoyaltyService.deductPoints.mockResolvedValue(undefined as any)

      const req = createMockRequest({
        body: {
          purchase_ids: ['purchase_1'],
          shipping_address_id: 'addr_1',
          shipping_method_id: 'standard',
          payment_method: 'cod',
          coins_used: 100,
        },
      })
      const res = createMockResponse()

      await createCheckoutOrder(req as Request, res as Response)

      expect(mockLoyaltyService.deductPoints).toHaveBeenCalledWith('user_1', 100, 'Sử dụng xu cho đơn hàng')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw BAD_REQUEST on ValidationError', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([mockPurchase] as any)
      mockOrderService.createOrder.mockRejectedValue(new ValidationError('Invalid items'))

      const req = createMockRequest({ body: { purchase_ids: ['purchase_1'] } })
      const res = createMockResponse()

      await expect(createCheckoutOrder(req as Request, res as Response))
        .rejects.toMatchObject({ status: STATUS.BAD_REQUEST })
    })

    it('should throw BAD_REQUEST on BusinessError', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([mockPurchase] as any)
      mockOrderService.createOrder.mockRejectedValue(new BusinessError('Sản phẩm hết hàng'))

      const req = createMockRequest({ body: { purchase_ids: ['purchase_1'] } })
      const res = createMockResponse()

      await expect(createCheckoutOrder(req as Request, res as Response))
        .rejects.toMatchObject({ status: STATUS.BAD_REQUEST })
    })

    it('should throw NOT_FOUND on NotFoundError', async () => {
      mockPurchaseService.getCartItemsByIds.mockResolvedValue([mockPurchase] as any)
      mockOrderService.createOrder.mockRejectedValue(new NotFoundError('Address', 'addr_999'))

      const req = createMockRequest({ body: { purchase_ids: ['purchase_1'], shipping_address_id: 'addr_999' } })
      const res = createMockResponse()

      await expect(createCheckoutOrder(req as Request, res as Response))
        .rejects.toMatchObject({ status: STATUS.NOT_FOUND })
    })
  })
})

