import { Pagination } from './api.type'

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
    pagination: Pagination
  }
}
