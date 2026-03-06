import { Product } from './product.type'

// Address types
export type AddressType = 'home' | 'office' | 'other'

export interface Address {
  _id: string
  userId: string
  fullName: string
  phone: string
  province: string
  provinceId?: string
  district: string
  districtId?: string
  ward: string
  wardId?: string
  street: string
  isDefault: boolean
  addressType?: AddressType
  label?: string
  createdAt: string
  updatedAt: string
}

export interface AddressFormData {
  fullName: string
  phone: string
  province: string
  provinceId?: string
  district: string
  districtId?: string
  ward: string
  wardId?: string
  street: string
  isDefault?: boolean
  addressType?: AddressType
  label?: string
}

// Shipping types
export interface ShippingMethod {
  _id: string
  name: string
  description: string
  price: number
  estimatedDays: string // e.g., "2-3 ngày"
  icon: string
}

// Payment types
export type PaymentMethodType = 'cod' | 'bank_transfer' | 'e_wallet' | 'credit_card'

export interface PaymentMethod {
  _id: string
  type: PaymentMethodType
  name: string
  description: string
  icon: string
  isAvailable: boolean
}

// Order types
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled' | 'returned'

export interface OrderItem {
  product: Product
  buyCount: number
  price: number
  priceBeforeDiscount: number
}

export interface Order {
  _id: string
  userId: string
  items: OrderItem[]
  shippingAddress: Address
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethodType
  subtotal: number
  shippingFee: number
  discount: number
  coinsUsed: number
  coinsDiscount: number
  total: number
  status: OrderStatus
  note?: string
  voucherCode?: string
  createdAt: string
  updatedAt: string
}

// Checkout request/response types
export interface CreateOrderBody {
  purchaseIds: string[]
  shippingAddressId: string
  shippingMethodId: string
  paymentMethod: PaymentMethodType
  voucherCode?: string
  coinsUsed?: number
  note?: string
}

export interface CheckoutSummaryBody {
  purchaseIds: string[]
  shippingMethodId?: string
  voucherCode?: string
  coinsUsed?: number
}

export interface CheckoutSummary {
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  discount: number
  coinsDiscount: number
  total: number
}

// Address list response
export interface AddressListResponse {
  addresses: Address[]
  total: number
}

// Order list response
export interface OrderListResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
