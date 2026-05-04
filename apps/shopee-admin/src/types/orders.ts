import type { User } from '@shopee/shared-types'
import type { Product } from '@shopee/shared-types'

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  product: Product | string
  buy_count: number
  price: number
  price_before_discount: number
}

export interface Order {
  _id: string
  user: User | string
  items: OrderItem[]
  total_price: number
  status: OrderStatus
  payment_method?: string
  shipping_address?: string
  note?: string
  createdAt: string
  updatedAt: string
}
