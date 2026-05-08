export interface ShippingMethod {
  _id: string
  name: string
  description?: string
  price: number
  estimated_days_min: number
  estimated_days_max: number
  icon?: string
  is_active: boolean
  sort_order: number
  createdAt: string
  updatedAt: string
}

export interface CreateShippingMethodBody {
  name: string
  description?: string
  price: number
  estimated_days_min: number
  estimated_days_max: number
  icon?: string
  is_active?: boolean
  sort_order?: number
}

export type UpdateShippingMethodBody = Partial<CreateShippingMethodBody>

export interface ReorderShippingItem {
  id: string
  sort_order: number
}
