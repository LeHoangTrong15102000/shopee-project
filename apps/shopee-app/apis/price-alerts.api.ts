import { type ApiResponse, type Pagination } from '@/types/api.type'
import http from '@/utils/http'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PriceHistoryPoint {
  date: string
  price: number
}

export interface PriceAlert {
  _id: string
  productId: string
  productName: string
  productImage: string
  currentPrice: number
  targetPrice: number
  status: 'active' | 'triggered'
  createdAt: string
  updatedAt: string
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getPriceHistory(productId: string, days = 30): Promise<PriceHistoryPoint[]> {
  const res = await http.get<ApiResponse<PriceHistoryPoint[]>>(
    `products/${productId}/price-history`,
    { params: { days } }
  )
  return res.data.data
}

export async function getPriceAlerts(): Promise<PriceAlert[]> {
  const res =
    await http.get<ApiResponse<{ price_alerts: PriceAlert[]; pagination: Pagination }>>(
      'price-alerts'
    )
  return res.data.data.price_alerts ?? []
}

export async function createPriceAlert(
  productId: string,
  targetPrice: number
): Promise<PriceAlert> {
  const res = await http.post<ApiResponse<PriceAlert>>('price-alerts', { productId, targetPrice })
  return res.data.data
}

export async function deletePriceAlert(alertId: string): Promise<void> {
  await http.delete<ApiResponse<void>>(`price-alerts/${alertId}`)
}
