import http from '@/utils/http'
import { type Category, type Product, type ProductListResponse } from '@/types/product.type'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CategoriesResponse {
  message: string
  data: Category[]
}

interface GetProductsParams {
  page: number
  limit: number
  category?: string
}

interface RecommendationResponse {
  message: string
  data: Product[]
}

export interface SharePayload {
  shareUrl: string
  shareCount: number
}

interface ShareResponse {
  message: string
  data: SharePayload
}

// ─── Product API ──────────────────────────────────────────────────────────────

export async function getProducts(
  params: GetProductsParams
): Promise<{ products: Product[]; pagination: ProductListResponse['data']['pagination'] }> {
  const queryParams: Record<string, string> = {
    page: String(params.page),
    limit: String(params.limit),
  }
  if (params.category) {
    queryParams.category = params.category
  }
  const res = await http.get<ProductListResponse>('products', { params: queryParams })
  return res.data.data
}

export async function getCategories(): Promise<Category[]> {
  const res = await http.get<CategoriesResponse>('categories')
  return res.data.data
}

export async function getSimilarProducts(id: string): Promise<Product[]> {
  const res = await http.get<RecommendationResponse>(`products/${id}/similar`)
  return res.data.data
}

export async function getBoughtTogether(id: string): Promise<Product[]> {
  const res = await http.get<RecommendationResponse>(`products/${id}/bought-together`)
  return res.data.data
}

export async function shareProduct(id: string): Promise<SharePayload> {
  const res = await http.post<ShareResponse>(`products/${id}/share`)
  return res.data.data
}
