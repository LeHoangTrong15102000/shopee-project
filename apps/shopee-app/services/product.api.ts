import { httpGet } from './http'

export interface Category {
  _id: string
  name: string
}

export interface Product {
  _id: string
  images: string[]
  price: number
  rating: number
  price_before_discount: number
  quantity: number
  sold: number
  view: number
  name: string
  category: { _id: string; name: string }
  image: string
  createdAt: string
  updatedAt: string
}

export interface ProductListResponse {
  message: string
  data: {
    products: Product[]
    pagination: {
      page: number
      limit: number
      page_size: number
    }
  }
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

export async function getProducts(params: GetProductsParams) {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.category) {
    searchParams.set('category', params.category)
  }
  const res = await httpGet<ProductListResponse>(`products?${searchParams.toString()}`)
  return res.data
}

export async function getCategories() {
  const res = await httpGet<CategoriesResponse>('categories')
  return res.data
}
