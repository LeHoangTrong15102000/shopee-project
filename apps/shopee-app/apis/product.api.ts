import http from '@/utils/http'
import { type Category, type Product, type ProductListResponse } from '@/types/product.type'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  message: string
  data: T
}

interface CategoriesResponse {
  message: string
  data: Category[]
}

interface GetProductsParams {
  page: number
  limit: number
  category?: string
}

// ─── Product API ──────────────────────────────────────────────────────────────

export async function getProducts(params: GetProductsParams): Promise<{ products: Product[]; pagination: ProductListResponse['data']['pagination'] }> {
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
