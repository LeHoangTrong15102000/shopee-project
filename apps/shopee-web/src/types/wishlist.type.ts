import { Product } from './product.type'

export interface WishlistItem {
  _id: string
  user: string
  product: Product
  addedAt: string
}

export interface WishlistPagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface WishlistResponse {
  wishlist: WishlistItem[]
  pagination: WishlistPagination
}

export interface WishlistCheckResponse {
  in_wishlist: boolean
}

export interface WishlistCountResponse {
  count: number
}

export interface WishlistClearResponse {
  deleted_count: number
}

export interface AddToWishlistBody {
  product_id: string
}
