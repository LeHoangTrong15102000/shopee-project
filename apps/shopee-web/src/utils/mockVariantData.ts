/**
 * Mock variant data for frontend development and testing.
 *
 * USAGE: This file provides mock variant data when the backend API doesn't return
 * real variant data. It's used in ProductDetail.tsx to demonstrate the variant
 * selector functionality.
 *
 * REMOVAL PLAN:
 * 1. Once the backend API returns real variant data in the product response,
 *    update ProductDetail.tsx to use product.variants and product.skus directly
 * 2. Remove the getMockVariants() and getMockSKUs() calls from ProductDetail.tsx
 * 3. Delete this entire file (mockVariantData.ts)
 * 4. Remove the import statement from ProductDetail.tsx
 *
 * @module mockVariantData
 * @deprecated This file should be removed once API returns real variant data
 */

// TODO: Remove mock data once API returns real variant data
import { ProductVariant } from 'src/types/variant.type'
import { ProductSKU } from 'src/types/product.type'

// Categories that should have size variants (clothing, shoes, etc.)
const CLOTHING_CATEGORIES = [
  'áo',
  'quần',
  'váy',
  'đầm',
  'giày',
  'dép',
  'thời trang',
  'shirt',
  'pants',
  'dress',
  'shoes',
  'fashion',
]

// Categories that are electronics (phones, tablets, etc.) - only color, no size
const ELECTRONICS_CATEGORIES = [
  'điện thoại',
  'phone',
  'tablet',
  'máy tính',
  'laptop',
  'computer',
  'điện tử',
  'electronic',
]

const mockColorVariant: ProductVariant = {
  _id: 'mock-color-variant',
  type: 'color',
  name: 'Màu sắc',
  options: [
    { name: 'Đỏ', value: 'red' },
    { name: 'Xanh dương', value: 'blue' },
    { name: 'Đen', value: 'black' },
    { name: 'Trắng', value: 'white' },
  ],
}

const mockSizeVariant: ProductVariant = {
  _id: 'mock-size-variant',
  type: 'size',
  name: 'Kích thước',
  options: [
    { name: 'S', value: 'S' },
    { name: 'M', value: 'M' },
    { name: 'L', value: 'L' },
    { name: 'XL', value: 'XL' },
  ],
}

const colors = ['red', 'blue', 'black', 'white']
const sizes = ['S', 'M', 'L', 'XL']

type ProductCategory = 'clothing' | 'electronics' | 'other'

function detectCategory(categoryName: string, productName: string): ProductCategory {
  const searchText = `${categoryName} ${productName}`.toLowerCase()

  // Check for clothing keywords
  if (CLOTHING_CATEGORIES.some((keyword) => searchText.includes(keyword))) {
    return 'clothing'
  }

  // Check for electronics keywords
  if (ELECTRONICS_CATEGORIES.some((keyword) => searchText.includes(keyword))) {
    return 'electronics'
  }

  return 'other'
}

function generateColorOnlySKUs(basePrice: number): ProductSKU[] {
  return colors.map((color, idx) => ({
    _id: `mock-sku-${idx}`,
    value: color,
    price: basePrice,
    stock: Math.floor(Math.random() * 50) + 5,
    variant_values: { color },
  }))
}

function generateColorAndSizeSKUs(basePrice: number): ProductSKU[] {
  const skus: ProductSKU[] = []
  let idx = 0
  for (const color of colors) {
    for (const size of sizes) {
      const priceModifier = size === 'XL' ? 50000 : size === 'L' ? 30000 : 0
      const stock = Math.floor(Math.random() * 50) + 5
      skus.push({
        _id: `mock-sku-${idx}`,
        value: `${color}-${size}`,
        price: basePrice + priceModifier,
        stock,
        variant_values: { color, size },
      })
      idx++
    }
  }
  return skus
}

/**
 * Returns mock variants for a product based on category.
 * - Electronics (phones, tablets): color only
 * - Clothing (shirts, pants): color + size
 * - Other: color only (default)
 *
 * TODO: Remove once API returns real variant data
 */
export function getMockVariants(categoryName: string, productName: string = ''): ProductVariant[] {
  const category = detectCategory(categoryName, productName)

  if (category === 'clothing') {
    return [mockColorVariant, mockSizeVariant]
  }

  // Electronics and other categories: color only
  return [mockColorVariant]
}

/**
 * Returns mock SKUs for a product based on category.
 * TODO: Remove once API returns real variant data
 */
export function getMockSKUs(
  basePrice: number,
  categoryName: string,
  productName: string = '',
): ProductSKU[] {
  const category = detectCategory(categoryName, productName)

  if (category === 'clothing') {
    return generateColorAndSizeSKUs(basePrice)
  }

  // Electronics and other categories: color only
  return generateColorOnlySKUs(basePrice)
}
