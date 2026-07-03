import http from '@/utils/http'
import { type ApiResponse } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export type FlashSaleStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED'

export interface FlashSale {
  _id: string
  name: string
  description?: string
  startTime: string
  endTime: string
  status: FlashSaleStatus
  createdAt?: string
  updatedAt?: string
}

export interface FlashSaleProduct {
  product_id: string
  original_price: number
  flash_price: number
  total_quantity: number
  sold_quantity: number
  remaining_quantity: number
  limit_per_user: number
}

// ─── Flash Sale API ───────────────────────────────────────────────────────────

/** GET flash-sales/active — returns all currently ACTIVE flash sales. */
export async function getActiveFlashSale(): Promise<FlashSale[]> {
  const res = await http.get<ApiResponse<FlashSale[]>>('flash-sales/active')
  return res.data.data
}

/** GET flash-sales/:id — returns detail for a single flash sale. */
export async function getFlashSaleDetail(id: string): Promise<FlashSale> {
  const res = await http.get<ApiResponse<FlashSale>>(`flash-sales/${id}`)
  return res.data.data
}

/** GET flash-sales/:id/products — returns flash-price products for a sale. */
export async function getFlashSaleProducts(id: string): Promise<FlashSaleProduct[]> {
  const res = await http.get<ApiResponse<FlashSaleProduct[]>>(`flash-sales/${id}/products`)
  return res.data.data
}
