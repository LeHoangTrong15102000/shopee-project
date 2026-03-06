export interface PricePoint {
  price: number
  date: string
}

export interface PriceHistory {
  product_id: string
  current_price: number
  lowest_price: number
  highest_price: number
  average_price: number
  price_points: PricePoint[]
  price_trend: 'up' | 'down' | 'stable'
  last_updated: string
}

export interface PriceAlert {
  _id: string
  product_id: string
  target_price: number
  is_active: boolean
  createdAt: string
}
