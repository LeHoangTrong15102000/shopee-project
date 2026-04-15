import type {
  Product as SharedProduct,
  ProductSKU,
  ProductListConfig,
  ProductVariant,
} from '@shopee/shared-types'

// shopee-web always receives populated category objects from the API,
// so we narrow the shared union type for backward compatibility.
export interface Product extends Omit<SharedProduct, 'category' | 'description' | 'location'> {
  description: string
  category: {
    _id: string
    name: string
  }
  location: string
}

export interface ProductList {
  products: Product[]
  pagination: {
    page: number
    limit: number
    page_size: number
  }
}

export type { ProductSKU, ProductListConfig, ProductVariant }
