import { Order, OrderListResponse } from 'src/types/checkout.type'
import { Product } from 'src/types/product.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const URL = '/orders'

const createMockProduct = (id: string, name: string, price: number, priceBeforeDiscount: number): Product => ({
  _id: id,
  name,
  price,
  price_before_discount: priceBeforeDiscount,
  image: `https://picsum.photos/seed/${id}/200/200`,
  images: [`https://picsum.photos/seed/${id}/200/200`, `https://picsum.photos/seed/${id}2/200/200`],
  rating: 4.5,
  quantity: 100,
  sold: 50,
  view: 1000,
  description: `Mô tả sản phẩm ${name}`,
  category: { _id: 'cat1', name: 'Thời trang' },
  location: 'TP. Hồ Chí Minh',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
})

const mockShippingAddress = {
  _id: 'addr1',
  userId: 'user1',
  fullName: 'Nguyễn Văn A',
  phone: '0901234567',
  province: 'Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  street: '123 Đường Lê Lợi',
  isDefault: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

const mockShippingStandard = {
  _id: 'standard',
  name: 'Giao hàng tiêu chuẩn',
  description: 'Giao hàng trong 3-5 ngày',
  price: 30000,
  estimatedDays: '3-5 ngày',
  icon: '🚚'
}

const mockShippingExpress = {
  _id: 'express',
  name: 'Giao hàng nhanh',
  description: 'Giao hàng trong 1-2 ngày',
  price: 50000,
  estimatedDays: '1-2 ngày',
  icon: '⚡'
}

const mockOrders: Order[] = [
  // PENDING - Chờ xác nhận (2 đơn)
  {
    _id: '65a1b2c3d4e5f6a7b8c9d0e1',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p1', 'Áo thun nam basic', 199000, 250000),
        buyCount: 2,
        price: 199000,
        priceBeforeDiscount: 250000
      },
      {
        product: createMockProduct('p2', 'Quần jean slim fit', 450000, 550000),
        buyCount: 1,
        price: 450000,
        priceBeforeDiscount: 550000
      }
    ],
    shippingAddress: mockShippingAddress,
    shippingMethod: mockShippingStandard,
    paymentMethod: 'cod',
    subtotal: 848000,
    shippingFee: 30000,
    discount: 50000,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: 828000,
    status: 'pending',
    createdAt: '2024-02-10T08:30:00.000Z',
    updatedAt: '2024-02-10T08:30:00.000Z'
  },
  {
    _id: '65a1b2c3d4e5f6a7b8c9d0e2',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p3', 'Giày sneaker trắng', 890000, 1200000),
        buyCount: 1,
        price: 890000,
        priceBeforeDiscount: 1200000
      }
    ],
    shippingAddress: { ...mockShippingAddress, _id: 'addr2', street: '456 Nguyễn Huệ' },
    shippingMethod: mockShippingExpress,
    paymentMethod: 'bank_transfer',
    subtotal: 890000,
    shippingFee: 50000,
    discount: 0,
    coinsUsed: 100,
    coinsDiscount: 10000,
    total: 930000,
    status: 'pending',
    createdAt: '2024-02-09T14:20:00.000Z',
    updatedAt: '2024-02-09T14:20:00.000Z'
  },

  // CONFIRMED - Chờ lấy hàng (2 đơn)
  {
    _id: '65b2c3d4e5f6a7b8c9d0e1f2',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p4', 'Túi xách nữ thời trang', 350000, 450000),
        buyCount: 1,
        price: 350000,
        priceBeforeDiscount: 450000
      },
      {
        product: createMockProduct('p5', 'Ví da nam cao cấp', 280000, 350000),
        buyCount: 1,
        price: 280000,
        priceBeforeDiscount: 350000
      }
    ],
    shippingAddress: mockShippingAddress,
    shippingMethod: mockShippingStandard,
    paymentMethod: 'cod',
    subtotal: 630000,
    shippingFee: 30000,
    discount: 30000,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: 630000,
    status: 'confirmed',
    createdAt: '2024-02-08T10:15:00.000Z',
    updatedAt: '2024-02-08T12:00:00.000Z'
  },
  {
    _id: '65b2c3d4e5f6a7b8c9d0e1f3',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p6', 'Đồng hồ thông minh', 1500000, 2000000),
        buyCount: 1,
        price: 1500000,
        priceBeforeDiscount: 2000000
      }
    ],
    shippingAddress: {
      ...mockShippingAddress,
      _id: 'addr3',
      district: 'Quận 3',
      ward: 'Phường 1',
      street: '789 Võ Văn Tần'
    },
    shippingMethod: mockShippingExpress,
    paymentMethod: 'bank_transfer',
    subtotal: 1500000,
    shippingFee: 0,
    discount: 100000,
    coinsUsed: 200,
    coinsDiscount: 20000,
    total: 1380000,
    status: 'confirmed',
    createdAt: '2024-02-07T16:45:00.000Z',
    updatedAt: '2024-02-07T18:30:00.000Z'
  },

  // SHIPPING - Đang giao (2 đơn)
  {
    _id: '65c3d4e5f6a7b8c9d0e1f2a3',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p7', 'Áo khoác dù unisex', 320000, 400000),
        buyCount: 2,
        price: 320000,
        priceBeforeDiscount: 400000
      }
    ],
    shippingAddress: mockShippingAddress,
    shippingMethod: mockShippingStandard,
    paymentMethod: 'cod',
    subtotal: 640000,
    shippingFee: 30000,
    discount: 0,
    coinsUsed: 50,
    coinsDiscount: 5000,
    total: 665000,
    status: 'shipping',
    createdAt: '2024-02-05T09:00:00.000Z',
    updatedAt: '2024-02-06T14:00:00.000Z'
  },
  {
    _id: '65c3d4e5f6a7b8c9d0e1f2a4',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p8', 'Balo laptop chống nước', 550000, 700000),
        buyCount: 1,
        price: 550000,
        priceBeforeDiscount: 700000
      },
      {
        product: createMockProduct('p9', 'Chuột không dây', 250000, 300000),
        buyCount: 1,
        price: 250000,
        priceBeforeDiscount: 300000
      }
    ],
    shippingAddress: {
      ...mockShippingAddress,
      _id: 'addr4',
      province: 'Hà Nội',
      district: 'Quận Hoàn Kiếm',
      ward: 'Phường Hàng Bạc',
      street: '12 Hàng Đào'
    },
    shippingMethod: mockShippingExpress,
    paymentMethod: 'bank_transfer',
    subtotal: 800000,
    shippingFee: 50000,
    discount: 80000,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: 770000,
    status: 'shipping',
    createdAt: '2024-02-04T11:30:00.000Z',
    updatedAt: '2024-02-05T08:00:00.000Z'
  },

  // DELIVERED - Hoàn thành (3 đơn)
  {
    _id: '65d4e5f6a7b8c9d0e1f2a3b4',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p10', 'Tai nghe bluetooth', 450000, 600000),
        buyCount: 1,
        price: 450000,
        priceBeforeDiscount: 600000
      }
    ],
    shippingAddress: mockShippingAddress,
    shippingMethod: mockShippingStandard,
    paymentMethod: 'cod',
    subtotal: 450000,
    shippingFee: 30000,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: 480000,
    status: 'delivered',
    createdAt: '2024-01-28T15:00:00.000Z',
    updatedAt: '2024-02-01T10:30:00.000Z'
  },
  {
    _id: '65d4e5f6a7b8c9d0e1f2a3b5',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p11', 'Áo sơ mi công sở', 380000, 450000),
        buyCount: 3,
        price: 380000,
        priceBeforeDiscount: 450000
      },
      {
        product: createMockProduct('p12', 'Cà vạt lụa', 150000, 200000),
        buyCount: 2,
        price: 150000,
        priceBeforeDiscount: 200000
      }
    ],
    shippingAddress: mockShippingAddress,
    shippingMethod: mockShippingExpress,
    paymentMethod: 'bank_transfer',
    subtotal: 1440000,
    shippingFee: 0,
    discount: 150000,
    coinsUsed: 300,
    coinsDiscount: 30000,
    total: 1260000,
    status: 'delivered',
    createdAt: '2024-01-20T08:45:00.000Z',
    updatedAt: '2024-01-23T16:00:00.000Z'
  },
  {
    _id: '65d4e5f6a7b8c9d0e1f2a3b6',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p13', 'Kính mát thời trang', 290000, 350000),
        buyCount: 1,
        price: 290000,
        priceBeforeDiscount: 350000
      }
    ],
    shippingAddress: { ...mockShippingAddress, _id: 'addr5', street: '99 Trần Hưng Đạo' },
    shippingMethod: mockShippingStandard,
    paymentMethod: 'cod',
    subtotal: 290000,
    shippingFee: 30000,
    discount: 20000,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: 300000,
    status: 'delivered',
    createdAt: '2024-01-15T12:00:00.000Z',
    updatedAt: '2024-01-18T09:00:00.000Z'
  },

  // CANCELLED - Đã hủy (2 đơn)
  {
    _id: '65e5f6a7b8c9d0e1f2a3b4c5',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p14', 'Váy đầm dự tiệc', 650000, 800000),
        buyCount: 1,
        price: 650000,
        priceBeforeDiscount: 800000
      }
    ],
    shippingAddress: mockShippingAddress,
    shippingMethod: mockShippingExpress,
    paymentMethod: 'bank_transfer',
    subtotal: 650000,
    shippingFee: 50000,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: 700000,
    status: 'cancelled',
    note: 'Đổi ý không muốn mua nữa',
    createdAt: '2024-02-01T10:00:00.000Z',
    updatedAt: '2024-02-01T12:30:00.000Z'
  },
  {
    _id: '65e5f6a7b8c9d0e1f2a3b4c6',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p15', 'Giày cao gót', 420000, 500000),
        buyCount: 1,
        price: 420000,
        priceBeforeDiscount: 500000
      },
      {
        product: createMockProduct('p16', 'Clutch dự tiệc', 280000, 350000),
        buyCount: 1,
        price: 280000,
        priceBeforeDiscount: 350000
      }
    ],
    shippingAddress: {
      ...mockShippingAddress,
      _id: 'addr6',
      district: 'Quận 7',
      ward: 'Phường Tân Phú',
      street: '55 Nguyễn Lương Bằng'
    },
    shippingMethod: mockShippingStandard,
    paymentMethod: 'cod',
    subtotal: 700000,
    shippingFee: 30000,
    discount: 70000,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: 660000,
    status: 'cancelled',
    note: 'Tìm được sản phẩm rẻ hơn',
    createdAt: '2024-01-25T14:30:00.000Z',
    updatedAt: '2024-01-25T16:00:00.000Z'
  },

  // RETURNED - Trả hàng (1 đơn)
  {
    _id: '65f6a7b8c9d0e1f2a3b4c5d6',
    userId: 'user1',
    items: [
      {
        product: createMockProduct('p17', 'Áo len mùa đông', 350000, 450000),
        buyCount: 1,
        price: 350000,
        priceBeforeDiscount: 450000
      }
    ],
    shippingAddress: mockShippingAddress,
    shippingMethod: mockShippingStandard,
    paymentMethod: 'cod',
    subtotal: 350000,
    shippingFee: 30000,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: 380000,
    status: 'returned',
    note: 'Sản phẩm không đúng mô tả',
    createdAt: '2024-01-10T09:00:00.000Z',
    updatedAt: '2024-01-14T11:00:00.000Z'
  }
]

const getFilteredOrders = (status?: string): Order[] => {
  if (!status || status === 'all') {
    return mockOrders
  }
  return mockOrders.filter((order) => order.status === status)
}

export interface OrderQueryParams {
  status?: string
  page?: number
  limit?: number
}

const orderApi = {
  getOrders: async (params: OrderQueryParams) => {
    try {
      const response = await http.get<SuccessResponseApi<OrderListResponse>>(URL, { params })
      return response
    } catch (error) {
      console.warn('Orders API not available, using mock data')
      const filteredOrders = getFilteredOrders(params.status)
      const page = params.page || 1
      const limit = params.limit || 10
      const total = filteredOrders.length
      const totalPages = Math.ceil(total / limit)
      const startIndex = (page - 1) * limit
      const paginatedOrders = filteredOrders.slice(startIndex, startIndex + limit)

      return {
        data: {
          message: 'Lấy danh sách đơn hàng thành công',
          data: {
            orders: paginatedOrders,
            pagination: { page, limit, total, totalPages }
          }
        }
      }
    }
  },

  getOrderById: async (id: string) => {
    try {
      const response = await http.get<SuccessResponseApi<Order>>(`${URL}/${id}`)
      return response
    } catch (error) {
      console.warn('Order API not available, using mock data')
      const order = mockOrders.find((o) => o._id === id) || mockOrders[0]
      return {
        data: {
          message: 'Lấy chi tiết đơn hàng thành công',
          data: order
        }
      }
    }
  },

  cancelOrder: async (id: string, reason?: string) => {
    try {
      const response = await http.put<SuccessResponseApi<Order>>(`${URL}/${id}/cancel`, { reason })
      return response
    } catch (error) {
      console.warn('⚠️ [cancelOrder] API not available, using mock data')
      const order = mockOrders.find((o) => o._id === id) || mockOrders[0]
      return {
        data: {
          message: 'Hủy đơn hàng thành công (mock)',
          data: {
            ...order,
            _id: id,
            status: 'cancelled' as const,
            updatedAt: new Date().toISOString()
          }
        }
      }
    }
  },

  returnOrder: async (id: string, reason: string) => {
    try {
      const response = await http.put<SuccessResponseApi<Order>>(`${URL}/${id}/return`, { reason })
      return response
    } catch (error) {
      console.warn('⚠️ [returnOrder] API not available, using mock data')
      const order = mockOrders.find((o) => o._id === id) || mockOrders[0]
      return {
        data: {
          message: 'Yêu cầu trả hàng thành công (mock)',
          data: {
            ...order,
            _id: id,
            status: 'returned' as const,
            updatedAt: new Date().toISOString()
          }
        }
      }
    }
  },

  confirmReceived: async (id: string) => {
    try {
      const response = await http.put<SuccessResponseApi<Order>>(`${URL}/${id}/confirm-received`)
      return response
    } catch (error) {
      console.warn('⚠️ [confirmReceived] API not available, using mock data')
      const order = mockOrders.find((o) => o._id === id) || mockOrders[0]
      return {
        data: {
          message: 'Xác nhận đã nhận hàng thành công (mock)',
          data: {
            ...order,
            _id: id,
            status: 'delivered' as const,
            updatedAt: new Date().toISOString()
          }
        }
      }
    }
  }
}

export default orderApi
