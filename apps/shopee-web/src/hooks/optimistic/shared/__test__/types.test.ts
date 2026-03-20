import { describe, it, expect } from 'vitest';
import { QUERY_KEYS } from '../types';

describe('QUERY_KEYS', () => {
  it('should have PURCHASES_IN_CART with correct structure', () => {
    expect(QUERY_KEYS.PURCHASES_IN_CART).toEqual(['purchases', { status: 'inCart' }]);
  });

  it('should have PRODUCT_REVIEWS function that returns correct key with productId', () => {
    const productId = 'product-123';
    const result = QUERY_KEYS.PRODUCT_REVIEWS(productId);
    expect(result).toEqual(['product-reviews', 'product-123']);
  });

  it('should have WISHLIST_CHECK function that returns correct key with productId', () => {
    const productId = 'product-456';
    const result = QUERY_KEYS.WISHLIST_CHECK(productId);
    expect(result).toEqual(['wishlist', 'check', 'product-456']);
  });

  it('should have all static keys with correct values', () => {
    expect(QUERY_KEYS.PRODUCTS).toEqual(['products']);
    expect(QUERY_KEYS.PRODUCT).toEqual(['product']);
    expect(QUERY_KEYS.WISHLIST).toEqual(['wishlist']);
    expect(QUERY_KEYS.WISHLIST_COUNT).toEqual(['wishlist', 'count']);
    expect(QUERY_KEYS.NOTIFICATIONS).toEqual(['notifications']);
  });

  it('should have function keys that return correct arrays', () => {
    // Test PRODUCT_REVIEWS function
    expect(typeof QUERY_KEYS.PRODUCT_REVIEWS).toBe('function');
    const reviewKey = QUERY_KEYS.PRODUCT_REVIEWS('test-id');
    expect(Array.isArray(reviewKey)).toBe(true);
    expect(reviewKey).toHaveLength(2);
    expect(reviewKey[0]).toBe('product-reviews');
    expect(reviewKey[1]).toBe('test-id');

    // Test WISHLIST_CHECK function
    expect(typeof QUERY_KEYS.WISHLIST_CHECK).toBe('function');
    const wishlistCheckKey = QUERY_KEYS.WISHLIST_CHECK('test-id');
    expect(Array.isArray(wishlistCheckKey)).toBe(true);
    expect(wishlistCheckKey).toHaveLength(3);
    expect(wishlistCheckKey[0]).toBe('wishlist');
    expect(wishlistCheckKey[1]).toBe('check');
    expect(wishlistCheckKey[2]).toBe('test-id');
  });

  it('should have all expected query key properties', () => {
    expect(QUERY_KEYS).toHaveProperty('PURCHASES_IN_CART');
    expect(QUERY_KEYS).toHaveProperty('PRODUCT_REVIEWS');
    expect(QUERY_KEYS).toHaveProperty('PRODUCTS');
    expect(QUERY_KEYS).toHaveProperty('PRODUCT');
    expect(QUERY_KEYS).toHaveProperty('WISHLIST');
    expect(QUERY_KEYS).toHaveProperty('WISHLIST_CHECK');
    expect(QUERY_KEYS).toHaveProperty('WISHLIST_COUNT');
    expect(QUERY_KEYS).toHaveProperty('NOTIFICATIONS');
  });
});
