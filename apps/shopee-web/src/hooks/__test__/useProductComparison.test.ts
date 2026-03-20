import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductComparison } from '../useProductComparison';
import { Product } from 'src/types/product.type';

describe('useProductComparison', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns empty list initially', () => {
    const { result } = renderHook(() => useProductComparison());

    expect(result.current.compareList).toEqual([]);
    expect(result.current.canAddMore).toBe(true);
  });

  it('addToCompare adds product and saves to localStorage', () => {
    const { result } = renderHook(() => useProductComparison());
    const product: Product = { _id: '1', name: 'Product 1' } as Product;

    act(() => {
      result.current.addToCompare(product);
    });

    expect(result.current.compareList).toHaveLength(1);
    expect(result.current.compareList[0]._id).toBe('1');
    expect(localStorage.getItem('comparison_products')).toBeTruthy();
  });

  it('removeFromCompare removes product', () => {
    const { result } = renderHook(() => useProductComparison());
    const product: Product = { _id: '1', name: 'Product 1' } as Product;

    act(() => {
      result.current.addToCompare(product);
    });

    act(() => {
      result.current.removeFromCompare('1');
    });

    expect(result.current.compareList).toHaveLength(0);
  });

  it('clearCompare clears all products', () => {
    const { result } = renderHook(() => useProductComparison());
    const product1: Product = { _id: '1', name: 'Product 1' } as Product;
    const product2: Product = { _id: '2', name: 'Product 2' } as Product;

    act(() => {
      result.current.addToCompare(product1);
      result.current.addToCompare(product2);
    });

    act(() => {
      result.current.clearCompare();
    });

    expect(result.current.compareList).toHaveLength(0);
    expect(localStorage.getItem('comparison_products')).toBeNull();
  });

  it('isInCompare returns correct boolean', () => {
    const { result } = renderHook(() => useProductComparison());
    const product: Product = { _id: '1', name: 'Product 1' } as Product;

    expect(result.current.isInCompare('1')).toBe(false);

    act(() => {
      result.current.addToCompare(product);
    });

    expect(result.current.isInCompare('1')).toBe(true);
  });

  it('canAddMore is false when 4 items', () => {
    const { result } = renderHook(() => useProductComparison());

    act(() => {
      result.current.addToCompare({ _id: '1', name: 'Product 1' } as Product);
      result.current.addToCompare({ _id: '2', name: 'Product 2' } as Product);
      result.current.addToCompare({ _id: '3', name: 'Product 3' } as Product);
      result.current.addToCompare({ _id: '4', name: 'Product 4' } as Product);
    });

    expect(result.current.canAddMore).toBe(false);
    expect(result.current.compareList).toHaveLength(4);
  });

  it('does not add duplicate products', () => {
    const { result } = renderHook(() => useProductComparison());
    const product: Product = { _id: '1', name: 'Product 1' } as Product;

    act(() => {
      result.current.addToCompare(product);
      result.current.addToCompare(product);
    });

    expect(result.current.compareList).toHaveLength(1);
  });

  it('loads from localStorage on mount', () => {
    const products = [
      { _id: '1', name: 'Product 1' },
      { _id: '2', name: 'Product 2' },
    ];
    localStorage.setItem('comparison_products', JSON.stringify(products));

    const { result } = renderHook(() => useProductComparison());

    expect(result.current.compareList).toHaveLength(2);
    expect(result.current.compareList[0]._id).toBe('1');
  });
});
