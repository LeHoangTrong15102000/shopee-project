/// <reference types="jest" />

import {
  validateVariantStructure,
  validateNoDuplicateVariantTypes,
  validateNoDuplicateOptions,
  validateVariantLimits,
  generateSKUCombinations,
  generateVariantValues,
  validateSKUCount,
  validateSKUValues,
  VariantInput,
} from '@utils/variant.helper'

// Helper to create option objects from strings
const opt = (value: string, name?: string) => ({ name: name || value, value })
const opts = (...values: string[]) => values.map((v) => opt(v))

describe('variant.helper', () => {
  describe('validateVariantStructure', () => {
    it('accepts valid variant', () => {
      expect(
        validateVariantStructure({ type: 'color', name: 'Màu sắc', options: opts('Red', 'Blue') }),
      ).toBeNull()
    })
    it('rejects null', () => {
      expect(validateVariantStructure(null)).toBe('Biến thể phải là một đối tượng hợp lệ')
    })
    it('rejects missing type', () => {
      expect(validateVariantStructure({ name: 'Màu', options: opts('Red') })).toBe(
        'Loại biến thể (type) không được để trống',
      )
    })
    it('rejects empty type', () => {
      expect(validateVariantStructure({ type: '', name: 'Màu', options: opts('Red') })).toBe(
        'Loại biến thể (type) không được để trống',
      )
    })
    it('rejects whitespace-only type', () => {
      expect(validateVariantStructure({ type: '   ', name: 'Màu', options: opts('Red') })).toBe(
        'Loại biến thể (type) không được để trống',
      )
    })
    it('rejects missing name', () => {
      expect(validateVariantStructure({ type: 'color', options: opts('Red') })).toBe(
        'Tên biến thể (name) không được để trống',
      )
    })
    it('rejects empty name', () => {
      expect(validateVariantStructure({ type: 'color', name: '', options: opts('Red') })).toBe(
        'Tên biến thể (name) không được để trống',
      )
    })
    it('rejects whitespace-only name', () => {
      expect(validateVariantStructure({ type: 'color', name: '   ', options: opts('Red') })).toBe(
        'Tên biến thể (name) không được để trống',
      )
    })
    it('rejects non-array options', () => {
      expect(validateVariantStructure({ type: 'color', name: 'Màu', options: 'Red' })).toBe(
        'Tùy chọn biến thể (options) phải là mảng không rỗng',
      )
    })
    it('rejects empty options array', () => {
      expect(validateVariantStructure({ type: 'color', name: 'Màu', options: [] })).toBe(
        'Tùy chọn biến thể (options) phải là mảng không rỗng',
      )
    })
    it('rejects option with empty name', () => {
      expect(
        validateVariantStructure({
          type: 'color',
          name: 'Màu',
          options: [{ name: '', value: 'red' }],
        }),
      ).toBe('Mỗi tùy chọn phải có tên (name) không rỗng')
    })
    it('rejects option with empty value', () => {
      expect(
        validateVariantStructure({
          type: 'color',
          name: 'Màu',
          options: [{ name: 'Red', value: '' }],
        }),
      ).toBe('Mỗi tùy chọn phải có giá trị (value) không rỗng')
    })
    it('rejects option with whitespace-only name', () => {
      expect(
        validateVariantStructure({
          type: 'color',
          name: 'Màu',
          options: [{ name: '   ', value: 'red' }],
        }),
      ).toBe('Mỗi tùy chọn phải có tên (name) không rỗng')
    })
    it('rejects option with whitespace-only value', () => {
      expect(
        validateVariantStructure({
          type: 'color',
          name: 'Màu',
          options: [{ name: 'Red', value: '   ' }],
        }),
      ).toBe('Mỗi tùy chọn phải có giá trị (value) không rỗng')
    })
    it('rejects string options (old format)', () => {
      expect(
        validateVariantStructure({ type: 'color', name: 'Màu', options: ['Red', 'Blue'] }),
      ).toBe('Mỗi tùy chọn phải là đối tượng có name và value')
    })
  })

  describe('validateNoDuplicateVariantTypes', () => {
    it('accepts unique types', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red') },
        { type: 'size', name: 'Size', options: opts('S') },
      ]
      expect(validateNoDuplicateVariantTypes(variants)).toBeNull()
    })
    it('rejects duplicate types', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu 1', options: opts('Red') },
        { type: 'color', name: 'Màu 2', options: opts('Blue') },
      ]
      expect(validateNoDuplicateVariantTypes(variants)).toContain('trùng lặp')
    })
    it('rejects case-insensitive duplicates', () => {
      const variants: VariantInput[] = [
        { type: 'Color', name: 'Màu 1', options: opts('Red') },
        { type: 'color', name: 'Màu 2', options: opts('Blue') },
      ]
      expect(validateNoDuplicateVariantTypes(variants)).toContain('trùng lặp')
    })
  })

  describe('validateNoDuplicateOptions', () => {
    it('accepts unique options', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
      ]
      expect(validateNoDuplicateOptions(variants)).toBeNull()
    })
    it('rejects duplicate options by value', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: [opt('Red'), opt('Blue'), opt('Red')] },
      ]
      expect(validateNoDuplicateOptions(variants)).toContain('trùng lặp')
    })
    it('rejects case-insensitive duplicates', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: [opt('Red'), opt('red')] },
      ]
      expect(validateNoDuplicateOptions(variants)).toContain('trùng lặp')
    })
  })

  describe('validateVariantLimits', () => {
    it('accepts within limits', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
      ]
      expect(validateVariantLimits(variants)).toBeNull()
    })
    it('rejects more than 5 variants', () => {
      const variants: VariantInput[] = Array.from({ length: 6 }, (_, i) => ({
        type: `type${i}`,
        name: `Name${i}`,
        options: opts('A'),
      }))
      expect(validateVariantLimits(variants)).toContain('tối đa là 5')
    })
    it('rejects more than 20 options per variant', () => {
      const variants: VariantInput[] = [
        {
          type: 'color',
          name: 'Màu',
          options: Array.from({ length: 21 }, (_, i) => opt(`opt${i}`)),
        },
      ]
      expect(validateVariantLimits(variants)).toContain('tối đa mỗi biến thể là 20')
    })
    it('rejects more than 100 SKU combinations', () => {
      const variants: VariantInput[] = [
        { type: 'a', name: 'A', options: Array.from({ length: 11 }, (_, i) => opt(`a${i}`)) },
        { type: 'b', name: 'B', options: Array.from({ length: 10 }, (_, i) => opt(`b${i}`)) },
      ]
      expect(validateVariantLimits(variants)).toContain('tối đa là 100')
    })
  })

  describe('generateSKUCombinations', () => {
    it('returns empty for empty variants', () => {
      expect(generateSKUCombinations([])).toEqual([])
    })
    it('generates for single variant', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
      ]
      expect(generateSKUCombinations(variants)).toEqual(['Red', 'Blue'])
    })
    it('generates for two variants', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
        { type: 'size', name: 'Size', options: opts('S', 'M') },
      ]
      expect(generateSKUCombinations(variants)).toEqual(['Red-S', 'Red-M', 'Blue-S', 'Blue-M'])
    })
    it('generates for three variants', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red') },
        { type: 'size', name: 'Size', options: opts('S', 'M') },
        { type: 'material', name: 'Chất liệu', options: opts('Cotton', 'Polyester') },
      ]
      expect(generateSKUCombinations(variants)).toEqual([
        'Red-S-Cotton',
        'Red-S-Polyester',
        'Red-M-Cotton',
        'Red-M-Polyester',
      ])
    })
  })

  describe('generateVariantValues', () => {
    it('returns empty for empty variants', () => {
      expect(generateVariantValues([])).toEqual([])
    })
    it('generates single variant mapping', () => {
      const variants: VariantInput[] = [{ type: 'color', name: 'Màu', options: opts('Red') }]
      expect(generateVariantValues(variants)).toEqual([{ color: 'Red' }])
    })
    it('generates multiple variant mapping', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
        { type: 'size', name: 'Size', options: opts('M') },
      ]
      expect(generateVariantValues(variants)).toEqual([
        { color: 'Red', size: 'M' },
        { color: 'Blue', size: 'M' },
      ])
    })
  })

  describe('validateSKUCount', () => {
    it('accepts correct count', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
        { type: 'size', name: 'Size', options: opts('S', 'M') },
      ]
      expect(validateSKUCount(variants, 4)).toBeNull()
    })
    it('rejects too few SKUs', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
        { type: 'size', name: 'Size', options: opts('S', 'M') },
      ]
      expect(validateSKUCount(variants, 3)).toContain('không khớp')
    })
    it('rejects too many SKUs', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
      ]
      expect(validateSKUCount(variants, 5)).toContain('không khớp')
    })
  })

  describe('validateSKUValues', () => {
    it('accepts valid values in order', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
        { type: 'size', name: 'Size', options: opts('S', 'M') },
      ]
      expect(validateSKUValues(variants, ['Red-S', 'Red-M', 'Blue-S', 'Blue-M'])).toBeNull()
    })
    it('rejects invalid value', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
      ]
      expect(validateSKUValues(variants, ['Green'])).toContain('không khớp')
    })
    it('rejects wrong order', () => {
      const variants: VariantInput[] = [
        { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
        { type: 'size', name: 'Size', options: opts('S', 'M') },
      ]
      expect(validateSKUValues(variants, ['Red-M', 'Red-S', 'Blue-S', 'Blue-M'])).toContain(
        'không khớp',
      )
    })
  })
})
