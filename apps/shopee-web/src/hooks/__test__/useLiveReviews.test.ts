import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useLiveReviews from '../useLiveReviews';

vi.mock('../useSocket', () => ({
  default: vi.fn(() => ({ socket: null, isConnected: false })),
}));

describe('useLiveReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render and return expected shape', () => {
    const { result } = renderHook(() => useLiveReviews('product-123'));

    expect(result.current).toHaveProperty('newReviews');
    expect(result.current).toHaveProperty('newComments');
    expect(result.current).toHaveProperty('likeUpdates');
    expect(result.current).toHaveProperty('clearNewReviews');
    expect(Array.isArray(result.current.newReviews)).toBe(true);
    expect(Array.isArray(result.current.newComments)).toBe(true);
    expect(result.current.likeUpdates instanceof Map).toBe(true);
    expect(typeof result.current.clearNewReviews).toBe('function');
  });

  it('should handle undefined productId', () => {
    const { result } = renderHook(() => useLiveReviews(undefined));

    expect(result.current.newReviews).toEqual([]);
    expect(result.current.newComments).toEqual([]);
  });
});
