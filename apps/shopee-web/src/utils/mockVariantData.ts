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
import { ProductVariant } from 'src/types/variant.type';
import { ProductSKU } from 'src/types/product.type';

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
};

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
};

const colors = ['red', 'blue', 'black', 'white'];
const sizes = ['S', 'M', 'L', 'XL'];

function generateMockSKUs(basePrice: number): ProductSKU[] {
  const skus: ProductSKU[] = [];
  let idx = 0;
  for (const color of colors) {
    for (const size of sizes) {
      const priceModifier = size === 'XL' ? 50000 : size === 'L' ? 30000 : 0;
      const stock = Math.floor(Math.random() * 50) + (idx % 3 === 0 ? 0 : 5);
      skus.push({
        _id: `mock-sku-${idx}`,
        value: `${color}-${size}`,
        price: basePrice + priceModifier,
        stock,
        variant_values: { color, size },
      });
      idx++;
    }
  }
  return skus;
}

/**
 * Returns mock variants for a product. Uses product ID as seed for consistency.
 * TODO: Remove once API returns real variant data
 */
export function getMockVariants(_productId: string): ProductVariant[] {
  return [mockColorVariant, mockSizeVariant];
}

/**
 * Returns mock SKUs for a product with various prices and stock levels.
 * TODO: Remove once API returns real variant data
 */
export function getMockSKUs(basePrice: number): ProductSKU[] {
  return generateMockSKUs(basePrice);
}
