export interface ProductVariantOption {
  name: string
  value: string
  image?: string
}

export interface ProductVariant {
  _id: string
  type: string
  name: string
  options: ProductVariantOption[]
}

export interface ProductSKU {
  _id: string
  value: string
  price: number
  stock: number
  image?: string
  variant_values: Record<string, string>
}

export interface ProductVariantCombination {
  _id: string
  variant_values: Record<string, string>
  price: number
  price_before_discount: number
  quantity: number
  sku: string
  image?: string
}

export interface ProductWithVariants {
  _id: string
  name: string
  variants: ProductVariant[]
  variant_combinations: ProductVariantCombination[]
  default_combination?: ProductVariantCombination
}

export interface Product {
  _id: string
  name: string
  image: string
  images: string[]
  description?: string
  category: { _id: string; name: string } | string
  price: number
  rating: number
  price_before_discount: number
  quantity: number
  sold: number
  view: number
  location?: string
  createdAt: string
  updatedAt: string
  variants?: ProductVariant[]
  skus?: ProductSKU[]
}

export interface ProductList {
  products: Product[]
  pagination: {
    page: number
    limit: number
    page_size: number
  }
}

export interface ProductListConfig {
  page?: number | string
  limit?: number | string
  sort_by?: 'createdAt' | 'view' | 'sold' | 'price'
  order?: 'asc' | 'desc'
  exclude?: string
  rating_filter?: number | string
  price_max?: number | string
  price_min?: number | string
  name?: string
  category?: string
}
