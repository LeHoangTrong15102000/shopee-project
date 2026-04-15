import { createMockProduct } from 'src/test-utils/factories'
import type { Product } from 'src/types'

export const mockLowStockProducts: Product[] = [
  createMockProduct({ _id: 'inv-1', name: 'iPhone 15 Pro', quantity: 5, sold: 95 }),
  createMockProduct({ _id: 'inv-2', name: 'Samsung Galaxy S24', quantity: 3, sold: 97 }),
  createMockProduct({ _id: 'inv-3', name: 'AirPods Pro', quantity: 8, sold: 92 }),
]

export const mockOutOfStockProducts: Product[] = [
  createMockProduct({ _id: 'inv-4', name: 'MacBook Pro M3', quantity: 0, sold: 100 }),
  createMockProduct({ _id: 'inv-5', name: 'iPad Air', quantity: 0, sold: 50 }),
]
