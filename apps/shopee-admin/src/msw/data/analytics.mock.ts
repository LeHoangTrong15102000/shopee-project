import { createMockProductAnalytics, createMockChatbotAnalytics } from 'src/test-utils/factories'
import type { ProductAnalytics, ChatbotAnalytics } from 'src/types'

export const mockProductAnalytics: ProductAnalytics[] = [
  createMockProductAnalytics({
    _id: 'pa-1',
    name: 'iPhone 15 Pro Max',
    sold: 120,
    view: 5000,
    rating: 4.8,
    revenue: 3598800000,
  }),
  createMockProductAnalytics({
    _id: 'pa-2',
    name: 'Samsung Galaxy S24',
    sold: 95,
    view: 4200,
    rating: 4.6,
    revenue: 2279050000,
  }),
  createMockProductAnalytics({
    _id: 'pa-3',
    name: 'MacBook Air M3',
    sold: 60,
    view: 3800,
    rating: 4.9,
    revenue: 1799400000,
  }),
]

export const mockCategoryStats = [
  {
    _id: 'cat-1',
    category_name: 'Điện thoại',
    product_count: 50,
    total_stock: 5000,
    total_sold: 1200,
    average_price: 15000000,
    average_rating: 4.5,
  },
  {
    _id: 'cat-2',
    category_name: 'Laptop',
    product_count: 30,
    total_stock: 2000,
    total_sold: 800,
    average_price: 25000000,
    average_rating: 4.6,
  },
  {
    _id: 'cat-3',
    category_name: 'Phụ kiện',
    product_count: 100,
    total_stock: 10000,
    total_sold: 3000,
    average_price: 500000,
    average_rating: 4.3,
  },
]

export const mockChatbotAnalytics: ChatbotAnalytics = createMockChatbotAnalytics()
