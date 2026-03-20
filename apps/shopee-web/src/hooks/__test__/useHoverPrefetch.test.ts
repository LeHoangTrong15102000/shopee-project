import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHoverPrefetch, useProgressivePrefetch } from '../useHoverPrefetch';

const mockPrefetchProduct = vi.fn();
const mockRelatedProducts = vi.fn();
const mockIsCached = vi.fn(() => false);

vi.mock('../usePrefetch', () => ({
  usePrefetch: vi.fn(() => ({
    prefetchProduct: mockPrefetchProduct,
    smartPrefetch: { relatedProducts: mockRelatedProducts },
    isCached: mockIsCached,
  })),
}));

describe('useHoverPrefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useHoverPrefetch('p1'));
    expect(result.current.prefetchState).toBe('idle');
    expect(result.current.hoverCount).toBe(0);
    expect(result.current.isPrefetched).toBe(false);
    expect(result.current.isQueued).toBe(false);
  });

  it('queues prefetch on mouse enter with delayed strategy', () => {
    const { result } = renderHook(() => useHoverPrefetch('p1'));
    act(() => {
      result.current.handleMouseEnter();
    });
    expect(result.current.isQueued).toBe(true);
    expect(result.current.hoverCount).toBe(1);
  });

  it('prefetches after delay', () => {
    const { result } = renderHook(() => useHoverPrefetch('p1', { delay: 300 }));
    act(() => {
      result.current.handleMouseEnter();
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockPrefetchProduct).toHaveBeenCalledWith('p1');
    expect(mockRelatedProducts).toHaveBeenCalledWith('p1');
    expect(result.current.isPrefetched).toBe(true);
  });

  it('cancels prefetch on mouse leave before delay', () => {
    const { result } = renderHook(() => useHoverPrefetch('p1', { delay: 300 }));
    act(() => {
      result.current.handleMouseEnter();
    });
    expect(result.current.isQueued).toBe(true);
    act(() => {
      result.current.handleMouseLeave();
    });
    expect(result.current.prefetchState).toBe('idle');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockPrefetchProduct).not.toHaveBeenCalled();
  });

  it('does not prefetch when disabled', () => {
    const { result } = renderHook(() => useHoverPrefetch('p1', { enabled: false }));
    act(() => {
      result.current.handleMouseEnter();
    });
    expect(result.current.prefetchState).toBe('idle');
    expect(mockPrefetchProduct).not.toHaveBeenCalled();
  });

  it('does not re-prefetch when already prefetched', () => {
    const { result } = renderHook(() => useHoverPrefetch('p1', { strategy: 'immediate' }));
    act(() => {
      result.current.handleMouseEnter();
    });
    expect(mockPrefetchProduct).toHaveBeenCalledTimes(1);
    act(() => {
      result.current.handleMouseEnter();
    });
    expect(mockPrefetchProduct).toHaveBeenCalledTimes(1);
  });

  it('prefetches immediately with immediate strategy', () => {
    const { result } = renderHook(() => useHoverPrefetch('p1', { strategy: 'immediate' }));
    act(() => {
      result.current.handleMouseEnter();
    });
    expect(mockPrefetchProduct).toHaveBeenCalledWith('p1');
    expect(result.current.isPrefetched).toBe(true);
  });

  it('intent-detection strategy prefetches on second hover', () => {
    const { result } = renderHook(() =>
      useHoverPrefetch('p1', { strategy: 'intent-detection', delay: 300 }),
    );
    // First hover - hoverCount is 0, not >= 2
    act(() => {
      result.current.handleMouseEnter();
    });
    // hoverCount becomes 1 after first call, but the check uses the value before setState
    // Second hover
    act(() => {
      result.current.handleMouseLeave();
    });
    act(() => {
      result.current.handleMouseEnter();
    });
    // Now hoverCount >= 2
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockPrefetchProduct).toHaveBeenCalled();
  });

  it('intent-detection prefetches when cached', () => {
    mockIsCached.mockReturnValue(true);
    const { result } = renderHook(() =>
      useHoverPrefetch('p1', { strategy: 'intent-detection', delay: 300 }),
    );
    act(() => {
      result.current.handleMouseEnter();
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockPrefetchProduct).toHaveBeenCalledWith('p1');
  });

  it('handleClick prefetches if idle', () => {
    const { result } = renderHook(() => useHoverPrefetch('p1'));
    act(() => {
      result.current.handleClick();
    });
    expect(mockPrefetchProduct).toHaveBeenCalledWith('p1');
    expect(result.current.isPrefetched).toBe(true);
  });

  it('handleClick does nothing if already prefetched', () => {
    const { result } = renderHook(() => useHoverPrefetch('p1', { strategy: 'immediate' }));
    act(() => {
      result.current.handleMouseEnter();
    });
    mockPrefetchProduct.mockClear();
    act(() => {
      result.current.handleClick();
    });
    expect(mockPrefetchProduct).not.toHaveBeenCalled();
  });

  it('cleans up timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useHoverPrefetch('p1', { delay: 300 }));
    act(() => {
      result.current.handleMouseEnter();
    });
    unmount();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockPrefetchProduct).not.toHaveBeenCalled();
  });

  it('mouse leave does nothing when not queued', () => {
    const { result } = renderHook(() => useHoverPrefetch('p1'));
    act(() => {
      result.current.handleMouseLeave();
    });
    expect(result.current.prefetchState).toBe('idle');
  });
});

describe('useProgressivePrefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns queuePrefetch function', () => {
    const { result } = renderHook(() => useProgressivePrefetch());
    expect(typeof result.current.queuePrefetch).toBe('function');
  });

  it('queues and processes prefetch items', () => {
    const { result } = renderHook(() => useProgressivePrefetch());
    act(() => {
      result.current.queuePrefetch('p1');
    });
    act(() => {
      result.current.queuePrefetch('p2');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(mockPrefetchProduct).toHaveBeenCalledWith('p1');
    expect(mockPrefetchProduct).toHaveBeenCalledWith('p2');
  });

  it('limits batch to 3 items', () => {
    const { result } = renderHook(() => useProgressivePrefetch());
    act(() => {
      result.current.queuePrefetch('p1');
      result.current.queuePrefetch('p2');
      result.current.queuePrefetch('p3');
      result.current.queuePrefetch('p4');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(mockPrefetchProduct).toHaveBeenCalledTimes(3);
  });
});
