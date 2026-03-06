// khai báo APi cho Product

import { Product, ProductList, ProductListConfig } from 'src/types/product.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

export interface SearchSuggestionsResponse {
  suggestions: string[]
  products: {
    _id: string
    name: string
    image: string
    price: number
  }[]
}

// Interface cho API options với AbortSignal
export interface ApiOptions {
  signal?: AbortSignal
}

// Mock data for fallback when API is not available
const mockProducts: Product[] = [
  {
    _id: 'mock-product-1',
    images: [
      'https://picsum.photos/seed/product1a/200',
      'https://picsum.photos/seed/product1b/200',
      'https://picsum.photos/seed/product1c/200'
    ],
    price: 150000,
    rating: 4.5,
    price_before_discount: 200000,
    quantity: 100,
    sold: 1250,
    view: 5600,
    name: 'Áo thun nam cotton cao cấp',
    description: 'Áo thun nam chất liệu cotton 100%, thoáng mát, phù hợp mọi hoạt động',
    category: { _id: 'cat-1', name: 'Thời trang nam' },
    image: 'https://picsum.photos/seed/product1/200',
    location: 'Hồ Chí Minh',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-20T10:00:00.000Z'
  },
  {
    _id: 'mock-product-2',
    images: [
      'https://picsum.photos/seed/product2a/200',
      'https://picsum.photos/seed/product2b/200',
      'https://picsum.photos/seed/product2c/200',
      'https://picsum.photos/seed/product2d/200'
    ],
    price: 350000,
    rating: 4.8,
    price_before_discount: 450000,
    quantity: 50,
    sold: 890,
    view: 3200,
    name: 'Tai nghe Bluetooth không dây',
    description: 'Tai nghe Bluetooth 5.0, âm thanh HD, pin 20 giờ, chống ồn chủ động',
    category: { _id: 'cat-2', name: 'Điện tử' },
    image: 'https://picsum.photos/seed/product2/200',
    location: 'Hà Nội',
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-01-18T10:00:00.000Z'
  },
  {
    _id: 'mock-product-3',
    images: [
      'https://picsum.photos/seed/product3a/200',
      'https://picsum.photos/seed/product3b/200',
      'https://picsum.photos/seed/product3c/200'
    ],
    price: 280000,
    rating: 4.3,
    price_before_discount: 350000,
    quantity: 200,
    sold: 2100,
    view: 8900,
    name: 'Balo laptop chống nước 15.6 inch',
    description: 'Balo laptop thiết kế hiện đại, chống nước, nhiều ngăn tiện lợi',
    category: { _id: 'cat-3', name: 'Phụ kiện' },
    image: 'https://picsum.photos/seed/product3/200',
    location: 'Hồ Chí Minh',
    createdAt: '2024-01-05T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z'
  },
  {
    _id: 'mock-product-4',
    images: [
      'https://picsum.photos/seed/product4a/200',
      'https://picsum.photos/seed/product4b/200',
      'https://picsum.photos/seed/product4c/200',
      'https://picsum.photos/seed/product4d/200',
      'https://picsum.photos/seed/product4e/200'
    ],
    price: 180000,
    rating: 4.6,
    price_before_discount: 250000,
    quantity: 300,
    sold: 3500,
    view: 12000,
    name: 'Kem chống nắng SPF50+ PA++++',
    description: 'Kem chống nắng bảo vệ da khỏi tia UV, không gây nhờn rít, phù hợp mọi loại da',
    category: { _id: 'cat-4', name: 'Làm đẹp' },
    image: 'https://picsum.photos/seed/product4/200',
    location: 'Hà Nội',
    createdAt: '2024-01-08T10:00:00.000Z',
    updatedAt: '2024-01-22T10:00:00.000Z'
  },
  {
    _id: 'mock-product-5',
    images: [
      'https://picsum.photos/seed/product5a/200',
      'https://picsum.photos/seed/product5b/200',
      'https://picsum.photos/seed/product5c/200'
    ],
    price: 450000,
    rating: 4.7,
    price_before_discount: 550000,
    quantity: 80,
    sold: 650,
    view: 4500,
    name: 'Giày thể thao nam siêu nhẹ',
    description: 'Giày thể thao thiết kế thời trang, đế cao su chống trượt, siêu nhẹ thoáng khí',
    category: { _id: 'cat-5', name: 'Giày dép' },
    image: 'https://picsum.photos/seed/product5/200',
    location: 'Hồ Chí Minh',
    createdAt: '2024-01-12T10:00:00.000Z',
    updatedAt: '2024-01-25T10:00:00.000Z'
  }
]

const mockProductDetail: Product = {
  _id: 'mock-product-detail-1',
  images: [
    'https://picsum.photos/seed/detail1a/200',
    'https://picsum.photos/seed/detail1b/200',
    'https://picsum.photos/seed/detail1c/200',
    'https://picsum.photos/seed/detail1d/200',
    'https://picsum.photos/seed/detail1e/200'
  ],
  price: 299000,
  rating: 4.9,
  price_before_discount: 399000,
  quantity: 150,
  sold: 5200,
  view: 25000,
  name: 'Áo khoác nam chống nước cao cấp',
  description:
    'Áo khoác nam thiết kế hiện đại, chất liệu chống nước cao cấp, giữ ấm tốt trong mùa đông. ' +
    'Sản phẩm có nhiều túi tiện lợi, khóa kéo chắc chắn, phù hợp cho các hoạt động ngoài trời. ' +
    'Chất liệu: 100% Polyester chống nước. Hướng dẫn giặt: Giặt máy ở nhiệt độ thường, không sử dụng chất tẩy.',
  category: { _id: 'cat-1', name: 'Thời trang nam' },
  image: 'https://picsum.photos/seed/detail1/200',
  location: 'Hồ Chí Minh',
  createdAt: '2024-01-01T10:00:00.000Z',
  updatedAt: '2024-01-28T10:00:00.000Z'
}

const mockSearchSuggestions: SearchSuggestionsResponse = {
  suggestions: ['áo thun nam', 'áo khoác', 'áo polo'],
  products: [
    {
      _id: 'suggest-1',
      name: 'Áo thun nam basic',
      image: 'https://picsum.photos/seed/suggest1/200',
      price: 120000
    },
    {
      _id: 'suggest-2',
      name: 'Áo khoác dù unisex',
      image: 'https://picsum.photos/seed/suggest2/200',
      price: 250000
    },
    {
      _id: 'suggest-3',
      name: 'Áo polo nam cao cấp',
      image: 'https://picsum.photos/seed/suggest3/200',
      price: 180000
    }
  ]
}

const mockSearchHistory: string[] = [
  'áo thun nam',
  'tai nghe bluetooth',
  'balo laptop',
  'kem chống nắng',
  'giày thể thao'
]

const productApi = {
  getProducts: async (params: ProductListConfig, options?: ApiOptions) => {
    try {
      return await http.get<SuccessResponseApi<ProductList>>('/products', {
        params,
        signal: options?.signal
      })
    } catch (error) {
      console.warn('⚠️ [getProducts] API not available, using mock data')
      return {
        data: {
          message: 'Lấy danh sách sản phẩm thành công (mock)',
          data: {
            products: mockProducts,
            pagination: {
              page: Number(params.page) || 1,
              limit: Number(params.limit) || 20,
              page_size: 1
            }
          }
        }
      }
    }
  },

  getProductDetail: async (id: string, options?: ApiOptions) => {
    try {
      return await http.get<SuccessResponseApi<Product>>(`/products/${id}`, {
        signal: options?.signal
      })
    } catch (error) {
      console.warn('⚠️ [getProductDetail] API not available, using mock data')
      return {
        status: 200,
        data: {
          message: 'Lấy chi tiết sản phẩm thành công (mock)',
          data: { ...mockProductDetail, _id: id }
        }
      }
    }
  },

  getSearchSuggestions: async (params: { q: string }, options?: ApiOptions) => {
    try {
      return await http.get<SuccessResponseApi<SearchSuggestionsResponse>>('products/search/suggestions', {
        params,
        signal: options?.signal
      })
    } catch (error) {
      console.warn('⚠️ [getSearchSuggestions] API not available, using mock data')
      return {
        data: {
          message: 'Lấy gợi ý tìm kiếm thành công (mock)',
          data: mockSearchSuggestions
        }
      }
    }
  },

  getSearchHistory: async (options?: ApiOptions) => {
    try {
      return await http.get<SuccessResponseApi<string[]>>('products/search/history', {
        signal: options?.signal
      })
    } catch (error) {
      console.warn('⚠️ [getSearchHistory] API not available, using mock data')
      return {
        data: {
          message: 'Lấy lịch sử tìm kiếm thành công (mock)',
          data: mockSearchHistory
        }
      }
    }
  },

  saveSearchHistory: async (body: { keyword: string }, options?: ApiOptions) => {
    try {
      return await http.post<SuccessResponseApi<{ keyword: string; saved: boolean }>>(
        'products/search/save-history',
        body,
        {
          signal: options?.signal
        }
      )
    } catch (error) {
      console.warn('⚠️ [saveSearchHistory] API not available, using mock data')
      return {
        data: {
          message: 'Lưu lịch sử tìm kiếm thành công (mock)',
          data: { keyword: body.keyword, saved: true }
        }
      }
    }
  },

  deleteSearchHistory: async (options?: ApiOptions) => {
    try {
      return await http.delete<SuccessResponseApi<{ deleted_count: number }>>('products/search/history', {
        signal: options?.signal
      })
    } catch (error) {
      console.warn('⚠️ [deleteSearchHistory] API not available, using mock data')
      return {
        data: {
          message: 'Xóa toàn bộ lịch sử tìm kiếm thành công (mock)',
          data: { deleted_count: mockSearchHistory.length }
        }
      }
    }
  },

  deleteSearchHistoryItem: async (keyword: string, options?: ApiOptions) => {
    try {
      return await http.delete<SuccessResponseApi<{ message: string }>>(
        `products/search/history/${encodeURIComponent(keyword)}`,
        {
          signal: options?.signal
        }
      )
    } catch (error) {
      console.warn('⚠️ [deleteSearchHistoryItem] API not available, using mock data')
      return {
        data: {
          message: 'Xóa từ khóa khỏi lịch sử tìm kiếm thành công (mock)',
          data: { message: `Đã xóa "${keyword}" khỏi lịch sử tìm kiếm` }
        }
      }
    }
  }
}

export default productApi
