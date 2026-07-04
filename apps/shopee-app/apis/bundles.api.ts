import http from '@/utils/http'

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * An unpopulated product ObjectId string as returned by the backend .lean() query.
 * The backend does not populate bundle products; each entry is a raw string ID.
 */
export type BundleItem = string

/**
 * Raw bundle shape returned by the backend via .lean().
 * productIds is an array of unpopulated ObjectId strings — the backend does NOT
 * populate products or compute bundle/original prices. Display discount info from
 * discountType/discountValue only; do not fabricate price fields.
 */
export interface Bundle {
  _id: string
  name: string
  description?: string
  /** Unpopulated ObjectId strings — product details must be fetched separately if needed */
  productIds: BundleItem[]
  discountType: 'percentage' | 'fixed' | 'buy_x_get_y'
  discountValue: number
  minQuantity: number
  isActive: boolean
  startDate?: string
  endDate?: string
  maxRedemptions?: number
  currentRedemptions: number
  createdAt: string
  updatedAt: string
}

interface BundleResponse {
  message: string
  data: Bundle
}

interface BundleListResponse {
  message: string
  data: Bundle[]
}

// ─── Bundle API ───────────────────────────────────────────────────────────────

export async function getBundles(): Promise<Bundle[]> {
  const res = await http.get<BundleListResponse>('bundles')
  return res.data.data
}

export async function getBundleDetail(id: string): Promise<Bundle> {
  const res = await http.get<BundleResponse>(`bundles/${id}`)
  return res.data.data
}

export async function getProductBundles(id: string): Promise<Bundle[]> {
  const res = await http.get<BundleListResponse>(`products/${id}/bundles`)
  return res.data.data
}
