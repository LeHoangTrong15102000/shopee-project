import { describe, it, expect } from 'vitest';
import { getMockVariants, getMockSKUs } from '../mockVariantData';

describe('mockVariantData', () => {
  describe('getMockVariants', () => {
    it('should return color + size for clothing category', () => {
      const variants = getMockVariants('áo', 'Áo thun');
      expect(variants).toHaveLength(2);
      expect(variants.map((v) => v.type)).toContain('color');
      expect(variants.map((v) => v.type)).toContain('size');
    });

    it('should return color only for electronics', () => {
      const variants = getMockVariants('điện thoại', 'iPhone');
      expect(variants).toHaveLength(1);
      expect(variants[0].type).toBe('color');
    });

    it('should return color only for other categories', () => {
      const variants = getMockVariants('sách', 'Novel');
      expect(variants).toHaveLength(1);
      expect(variants[0].type).toBe('color');
    });

    it('should detect clothing from product name', () => {
      const variants = getMockVariants('other', 'shirt blue');
      expect(variants).toHaveLength(2);
    });

    it('should detect clothing from category "quần"', () => {
      const variants = getMockVariants('quần', '');
      expect(variants).toHaveLength(2);
    });

    it('should detect clothing from category "váy"', () => {
      const variants = getMockVariants('váy', '');
      expect(variants).toHaveLength(2);
    });

    it('should detect clothing from category "giày"', () => {
      const variants = getMockVariants('giày', '');
      expect(variants).toHaveLength(2);
    });

    it('should detect electronics from category "tablet"', () => {
      const variants = getMockVariants('tablet', '');
      expect(variants).toHaveLength(1);
    });

    it('should detect electronics from category "laptop"', () => {
      const variants = getMockVariants('laptop', '');
      expect(variants).toHaveLength(1);
    });

    it('should be case insensitive', () => {
      const variants = getMockVariants('ÁO', 'SHIRT');
      expect(variants).toHaveLength(2);
    });

    it('should have correct variant structure', () => {
      const variants = getMockVariants('áo', '');
      expect(variants[0]).toHaveProperty('_id');
      expect(variants[0]).toHaveProperty('type');
      expect(variants[0]).toHaveProperty('name');
      expect(variants[0]).toHaveProperty('options');
      expect(Array.isArray(variants[0].options)).toBe(true);
    });
  });

  describe('getMockSKUs', () => {
    it('should generate color-only SKUs for electronics', () => {
      const skus = getMockSKUs(1000000, 'phone');
      expect(skus.length).toBe(4); // 4 colors
      expect(skus[0].variant_values).toHaveProperty('color');
      expect(skus[0].variant_values).not.toHaveProperty('size');
    });

    it('should generate color+size SKUs for clothing', () => {
      const skus = getMockSKUs(200000, 'áo');
      expect(skus.length).toBe(16); // 4 colors * 4 sizes
      expect(skus[0].variant_values).toHaveProperty('color');
      expect(skus[0].variant_values).toHaveProperty('size');
    });

    it('should apply price modifier for XL size', () => {
      const skus = getMockSKUs(200000, 'quần');
      const xlSku = skus.find((s) => s.variant_values?.size === 'XL');
      expect(xlSku!.price).toBe(250000);
    });

    it('should apply price modifier for L size', () => {
      const skus = getMockSKUs(200000, 'quần');
      const lSku = skus.find((s) => s.variant_values?.size === 'L');
      expect(lSku!.price).toBe(230000);
    });

    it('should not apply price modifier for S and M sizes', () => {
      const skus = getMockSKUs(200000, 'quần');
      const sSku = skus.find((s) => s.variant_values?.size === 'S');
      const mSku = skus.find((s) => s.variant_values?.size === 'M');
      expect(sSku!.price).toBe(200000);
      expect(mSku!.price).toBe(200000);
    });

    it('should generate SKUs with stock', () => {
      const skus = getMockSKUs(200000, 'áo');
      skus.forEach((sku) => {
        expect(sku.stock).toBeGreaterThanOrEqual(5);
        expect(sku.stock).toBeLessThanOrEqual(55);
      });
    });

    it('should generate unique SKU IDs', () => {
      const skus = getMockSKUs(200000, 'áo');
      const ids = skus.map((s) => s._id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate correct value format for color-only SKUs', () => {
      const skus = getMockSKUs(100000, 'phone');
      skus.forEach((sku) => {
        expect(sku.value).toMatch(/^(red|blue|black|white)$/);
      });
    });

    it('should generate correct value format for color+size SKUs', () => {
      const skus = getMockSKUs(200000, 'áo');
      skus.forEach((sku) => {
        expect(sku.value).toMatch(/^(red|blue|black|white)-(S|M|L|XL)$/);
      });
    });

    it('should use base price for electronics', () => {
      const basePrice = 5000000;
      const skus = getMockSKUs(basePrice, 'điện thoại');
      skus.forEach((sku) => {
        expect(sku.price).toBe(basePrice);
      });
    });

    it('should handle other categories as color-only', () => {
      const skus = getMockSKUs(100000, 'sách');
      expect(skus.length).toBe(4);
      expect(skus[0].variant_values).toHaveProperty('color');
      expect(skus[0].variant_values).not.toHaveProperty('size');
    });
  });
});
