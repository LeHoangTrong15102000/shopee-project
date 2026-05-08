export type PaymentMethodType = 'cod' | 'bank_transfer' | 'e_wallet' | 'credit_card'

export interface PaymentMethod {
  _id: string
  name: string
  description?: string
  icon?: string
  type: PaymentMethodType
  is_active: boolean
  sort_order: number
  instructions?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentMethodBody {
  name: string
  description?: string
  icon?: string
  type: PaymentMethodType
  is_active?: boolean
  sort_order?: number
  instructions?: string
}

export type UpdatePaymentMethodBody = Partial<CreatePaymentMethodBody>

export interface ReorderPaymentItem {
  id: string
  sort_order: number
}
