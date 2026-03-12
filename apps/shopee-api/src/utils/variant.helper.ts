/**
 * Variant helper utilities for product variant validation and SKU generation.
 * Handles validation of variant structures, duplicate detection, limits enforcement,
 * and Cartesian product-based SKU combination generation.
 * @module variant.helper
 */

/** Represents a variant option with name, value, and optional image */
export interface VariantOption {
  /** Display name for the option (e.g., "Đỏ", "Xanh") */
  name: string
  /** Value identifier for the option (e.g., "red", "blue") */
  value: string
  /** Optional image URL for the option */
  image?: string
}

/** Represents a product variant with type, display name, and available options */
export interface VariantInput {
  /** Variant type identifier (e.g., "color", "size") */
  type: string
  /** Display name for the variant (e.g., "Màu sắc", "Kích thước") */
  name: string
  /** Array of option objects */
  options: VariantOption[]
}

/** Maximum number of variants per product */
export const MAX_VARIANTS = 5
/** Maximum number of options per variant */
export const MAX_OPTIONS_PER_VARIANT = 20
/** Maximum number of SKU combinations per product */
export const MAX_SKU_COMBINATIONS = 100

/**
 * Validates that a variant has the correct structure with type, name, and options fields.
 * @param variant - The variant object to validate
 * @returns Error message string if invalid, null if valid
 */
export function validateVariantStructure(variant: unknown): string | null {
  if (!variant || typeof variant !== 'object') {
    return 'Biến thể phải là một đối tượng hợp lệ'
  }
  const v = variant as Record<string, unknown>
  if (typeof v.type !== 'string' || v.type.trim() === '') {
    return 'Loại biến thể (type) không được để trống'
  }
  if (typeof v.name !== 'string' || v.name.trim() === '') {
    return 'Tên biến thể (name) không được để trống'
  }
  if (!Array.isArray(v.options) || v.options.length === 0) {
    return 'Tùy chọn biến thể (options) phải là mảng không rỗng'
  }
  for (const opt of v.options) {
    if (typeof opt === 'object' && opt !== null) {
      const optObj = opt as Record<string, unknown>
      if (typeof optObj.name !== 'string' || optObj.name.trim() === '') {
        return 'Mỗi tùy chọn phải có tên (name) không rỗng'
      }
      if (typeof optObj.value !== 'string' || optObj.value.trim() === '') {
        return 'Mỗi tùy chọn phải có giá trị (value) không rỗng'
      }
    } else {
      return 'Mỗi tùy chọn phải là đối tượng có name và value'
    }
  }
  return null
}

/**
 * Validates that there are no duplicate variant types (case-insensitive).
 * @param variants - Array of variants to check for duplicate types
 * @returns Error message string if duplicates found, null if valid
 */
export function validateNoDuplicateVariantTypes(variants: VariantInput[]): string | null {
  const seen = new Set<string>()
  for (const variant of variants) {
    const key = variant.type.toLowerCase().trim()
    if (seen.has(key)) {
      return `Loại biến thể "${variant.type}" bị trùng lặp`
    }
    seen.add(key)
  }
  return null
}

/**
 * Validates that there are no duplicate options within each variant (case-insensitive by value).
 * @param variants - Array of variants to check for duplicate options
 * @returns Error message string if duplicates found, null if valid
 */
export function validateNoDuplicateOptions(variants: VariantInput[]): string | null {
  for (const variant of variants) {
    const seen = new Set<string>()
    for (const option of variant.options) {
      const key = option.value.toLowerCase().trim()
      if (seen.has(key)) {
        return `Tùy chọn "${option.name}" bị trùng lặp trong biến thể "${variant.name}"`
      }
      seen.add(key)
    }
  }
  return null
}

/**
 * Validates variant limits: max variants, max options per variant, max SKU combinations.
 * @param variants - Array of variants to validate against limits
 * @returns Error message string if limits exceeded, null if valid
 */
export function validateVariantLimits(variants: VariantInput[]): string | null {
  if (variants.length > MAX_VARIANTS) {
    return `Số lượng biến thể tối đa là ${MAX_VARIANTS}, hiện tại có ${variants.length}`
  }
  for (const variant of variants) {
    if (variant.options.length > MAX_OPTIONS_PER_VARIANT) {
      return `Số tùy chọn tối đa mỗi biến thể là ${MAX_OPTIONS_PER_VARIANT}, biến thể "${variant.name}" có ${variant.options.length}`
    }
  }
  const totalCombinations = variants.reduce((acc, v) => acc * v.options.length, 1)
  if (totalCombinations > MAX_SKU_COMBINATIONS) {
    return `Số tổ hợp SKU tối đa là ${MAX_SKU_COMBINATIONS}, hiện tại có ${totalCombinations}`
  }
  return null
}

/**
 * Generates all SKU combinations from variants using Cartesian product algorithm.
 * @param variants - Array of variants to generate combinations from
 * @returns Array of SKU value strings (e.g., ["red-s", "red-m", "blue-s", "blue-m"])
 */
export function generateSKUCombinations(variants: VariantInput[]): string[] {
  if (!variants || variants.length === 0) return []
  const optionArrays = variants.map((v) => v.options.map((o) => o.value))
  return cartesianProduct(optionArrays).map((combo) => combo.join('-'))
}

/**
 * Generates variant_values mapping for each SKU combination.
 * @param variants - Array of variants to generate mappings from
 * @returns Array of objects mapping variant types to selected values
 */
export function generateVariantValues(variants: VariantInput[]): Record<string, string>[] {
  if (!variants || variants.length === 0) return []
  const optionArrays = variants.map((v) => v.options.map((o) => o.value))
  const types = variants.map((v) => v.type.toLowerCase())
  return cartesianProduct(optionArrays).map((combo) => {
    const values: Record<string, string> = {}
    types.forEach((type, i) => {
      values[type] = combo[i]
    })
    return values
  })
}

/**
 * Validates that the SKU count matches the expected number of combinations.
 * @param variants - Array of variants to calculate expected count
 * @param skuCount - Actual SKU count to validate
 * @returns Error message string if mismatch, null if valid
 */
export function validateSKUCount(variants: VariantInput[], skuCount: number): string | null {
  const expected = generateSKUCombinations(variants).length
  if (skuCount !== expected) {
    return `Số lượng SKU không khớp: cần ${expected}, nhận được ${skuCount}`
  }
  return null
}

/**
 * Validates that each SKU value matches a generated combination in order.
 * @param variants - Array of variants to generate expected combinations
 * @param skuValues - Array of SKU values to validate
 * @returns Error message string if mismatch, null if valid
 */
export function validateSKUValues(variants: VariantInput[], skuValues: string[]): string | null {
  const expected = generateSKUCombinations(variants)
  for (let i = 0; i < expected.length; i++) {
    if (skuValues[i] !== expected[i]) {
      return `SKU tại vị trí ${i} không khớp: cần "${expected[i]}", nhận được "${skuValues[i]}"`
    }
  }
  return null
}

/**
 * Computes the Cartesian product of multiple arrays.
 * @param arrays - Arrays to compute product from
 * @returns Array of all possible combinations
 */
function cartesianProduct(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]]
  )
}

