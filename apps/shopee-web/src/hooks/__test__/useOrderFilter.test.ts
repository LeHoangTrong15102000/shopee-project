import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrderFilter } from '../useOrderFilter';
import type { Purchase } from 'src/types/purchases.type';

describe('useOrderFilter', () => {
  it('initializes with empty filters', () => {
    const { result } = renderHook(() => useOrderFilter());

    expect(result.current.filters.searchQuery).toBe('');
    expect(result.current.filters.dateRange).toBeNull();
    expect(result.current.filters.priceRange).toBeNull();
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('sets search query', () => {
    const { result } = renderHook(() => useOrderFilter());

    act(() => {
      result.current.setSearchQuery('iphone');
    });

    expect(result.current.filters.searchQuery).toBe('iphone');
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('sets date range', () => {
    const { result } = renderHook(() => useOrderFilter());

    act(() => {
      result.current.setDateRange({ from: '2024-01-01', to: '2024-12-31' });
    });

    expect(result.current.filters.dateRange).toEqual({ from: '2024-01-01', to: '2024-12-31' });
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('sets price range', () => {
    const { result } = renderHook(() => useOrderFilter());

    act(() => {
      result.current.setPriceRange({ min: 100000, max: 500000 });
    });

    expect(result.current.filters.priceRange).toEqual({ min: 100000, max: 500000 });
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('clears all filters', () => {
    const { result } = renderHook(() => useOrderFilter());

    act(() => {
      result.current.setSearchQuery('test');
      result.current.setDateRange({ from: '2024-01-01', to: '2024-12-31' });
      result.current.setPriceRange({ min: 0, max: 1000000 });
    });

    expect(result.current.activeFilterCount).toBe(3);

    act(() => {
      result.current.clearAllFilters();
    });

    expect(result.current.filters.searchQuery).toBe('');
    expect(result.current.filters.dateRange).toBeNull();
    expect(result.current.filters.priceRange).toBeNull();
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('filters purchases by search query', () => {
    const { result } = renderHook(() => useOrderFilter());

    const mockPurchases = [
      { product: { name: 'iPhone 15', price: 25000000 }, buy_count: 1, createdAt: '2024-06-01' },
      {
        product: { name: 'Samsung Galaxy', price: 20000000 },
        buy_count: 1,
        createdAt: '2024-06-01',
      },
    ] as Purchase[];

    act(() => {
      result.current.setSearchQuery('iphone');
    });

    const filtered = result.current.filterPurchases(mockPurchases);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].product.name).toBe('iPhone 15');
  });

  it('filters purchases by date range', () => {
    const { result } = renderHook(() => useOrderFilter());

    const mockPurchases = [
      { product: { name: 'iPhone 15', price: 25000000 }, buy_count: 1, createdAt: '2024-06-15' },
      { product: { name: 'Samsung Galaxy', price: 20000000 }, buy_count: 1, createdAt: '2024-03-01' },
      { product: { name: 'Xiaomi', price: 10000000 }, buy_count: 1, createdAt: '2024-08-20' },
    ] as Purchase[];

    act(() => {
      result.current.setDateRange({ from: '2024-06-01', to: '2024-06-30' });
    });

    const filtered = result.current.filterPurchases(mockPurchases);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].product.name).toBe('iPhone 15');
  });

  it('filters purchases by price range', () => {
    const { result } = renderHook(() => useOrderFilter());

    const mockPurchases = [
      { product: { name: 'iPhone 15', price: 25000000 }, buy_count: 1, createdAt: '2024-06-01' },
      { product: { name: 'Samsung Galaxy', price: 20000000 }, buy_count: 1, createdAt: '2024-06-01' },
      { product: { name: 'Xiaomi', price: 5000000 }, buy_count: 2, createdAt: '2024-06-01' },
    ] as Purchase[];

    act(() => {
      result.current.setPriceRange({ min: 10000000, max: 22000000 });
    });

    const filtered = result.current.filterPurchases(mockPurchases);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.product.name)).toEqual(['Samsung Galaxy', 'Xiaomi']);
  });

  it('applies multiple filters together', () => {
    const { result } = renderHook(() => useOrderFilter());

    const mockPurchases = [
      { product: { name: 'iPhone 15', price: 25000000 }, buy_count: 1, createdAt: '2024-06-15' },
      { product: { name: 'iPhone 14', price: 20000000 }, buy_count: 1, createdAt: '2024-03-01' },
      { product: { name: 'Samsung Galaxy', price: 20000000 }, buy_count: 1, createdAt: '2024-06-15' },
    ] as Purchase[];

    act(() => {
      result.current.setSearchQuery('iphone');
      result.current.setDateRange({ from: '2024-06-01', to: '2024-06-30' });
    });

    const filtered = result.current.filterPurchases(mockPurchases);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].product.name).toBe('iPhone 15');
  });
});
