export interface ProductVariantOption {
  name: string // Ví dụ: "Đỏ", "Xanh", "S", "M", "L"
  value: string
  image?: string // Hình ảnh cho màu sắc
}

export interface ProductVariant {
  _id: string
  type: 'color' | 'size' | 'style' | 'material' // Loại variant
  name: string // Tên hiển thị: "Màu sắc", "Kích thước"
  options: ProductVariantOption[]
}

export interface ProductVariantCombination {
  _id: string
  variant_values: { [key: string]: string } // { color: "Đỏ", size: "M" }
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
