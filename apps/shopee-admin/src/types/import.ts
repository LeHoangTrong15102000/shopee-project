export interface ImportResult {
  imported: number
  deleted: number
  locationStats: Array<{ _id: string; count: number }>
}

export interface ImportStats {
  totalProducts: number
  productsWithLocation: number
  locationStats: Array<{ _id: string; count: number }>
}
