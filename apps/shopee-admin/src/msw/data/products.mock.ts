import { createMockProduct, createMockCategory } from 'src/test-utils/factories'
import type { Product, Category } from 'src/types'

export const mockCategories: Category[] = [
  createMockCategory({ _id: 'cat-1', name: 'Điện thoại' }),
  createMockCategory({ _id: 'cat-2', name: 'Laptop' }),
  createMockCategory({ _id: 'cat-3', name: 'Máy tính bảng' }),
  createMockCategory({ _id: 'cat-4', name: 'Phụ kiện' }),
]

export const mockProducts: Product[] = [
  createMockProduct({
    _id: 'prod-1',
    name: 'iPhone 15 Pro Max',
    price: 29990000,
    category: { _id: 'cat-1', name: 'Điện thoại' },
    sold: 150,
    quantity: 200,
  }),
  createMockProduct({
    _id: 'prod-2',
    name: 'Samsung Galaxy S24',
    price: 22990000,
    category: { _id: 'cat-1', name: 'Điện thoại' },
    sold: 120,
    quantity: 180,
  }),
  createMockProduct({
    _id: 'prod-3',
    name: 'MacBook Pro M3',
    price: 49990000,
    category: { _id: 'cat-2', name: 'Laptop' },
    sold: 80,
    quantity: 50,
  }),
  createMockProduct({
    _id: 'prod-4',
    name: 'iPad Air M2',
    price: 16990000,
    category: { _id: 'cat-3', name: 'Máy tính bảng' },
    sold: 60,
    quantity: 100,
  }),
  createMockProduct({
    _id: 'prod-5',
    name: 'AirPods Pro 2',
    price: 5990000,
    category: { _id: 'cat-4', name: 'Phụ kiện' },
    sold: 300,
    quantity: 500,
  }),
]
