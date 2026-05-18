export interface ImportResult {
  created: number
  updated: number
  failed: number
  errors: Array<{ index: number; row: unknown; errors: string[] }>
}

export interface ImportStats {
  totalProducts: number
  productsWithLocation: number
  locationStats: Array<{ _id: string; count: number }>
}
