export interface RegisterBody {
  email: string
  password: string
  name?: string
  date_of_birth?: string
  address?: string
  phone?: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface ProductBody {
  name: string
  image: string
  images: string[]
  description?: string
  category: string | string[]
  price: number
  rating?: number
  price_before_discount?: number
  quantity: number
  sold?: number
  view?: number
  variants?: Array<{
    type: string
    name: string
    options: Array<{ name: string; value: string; image?: string }>
  }>
  skus?: Array<{
    value: string
    price: number
    stock: number
    image?: string
    variant_values?: Record<string, string>
  }>
}

export interface PurchaseBody {
  product_id: string
  buy_count: number
  sku_id?: string
  /** Present only on variant-switch requests. When set (and different from sku_id),
   *  the update endpoint switches the cart line from sku_id to target_sku_id. */
  target_sku_id?: string
}

export interface BuyProductItem {
  product_id: string
  buy_count: number
  sku_id?: string
}

export interface ProductQueryParams {
  page?: string | number
  limit?: string | number
  category?: string
  exclude?: string
  sort_by?: string
  order?: string
  rating_filter?: string | number
  price_max?: string | number
  price_min?: string | number
  name?: string
}

export interface PaginationParams {
  page?: string | number
  limit?: string | number
}
