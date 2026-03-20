import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useLiveQA from '../useLiveQA';

vi.mock('../useSocket', () => ({
  default: vi.fn(() => ({ socket: null, isConnected: false })),
}));

describe('useLiveQA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render and return expected shape', () => {
    const { result } = renderHook(() => useLiveQA('product-123'));

    expect(result.current).toHaveProperty('newQuestions');
    expect(result.current).toHaveProperty('newAnswers');
    expect(result.current).toHaveProperty('likeUpdates');
    expect(result.current).toHaveProperty('clearNewQuestions');
    expect(Array.isArray(result.current.newQuestions)).toBe(true);
    expect(Array.isArray(result.current.newAnswers)).toBe(true);
    expect(result.current.likeUpdates instanceof Map).toBe(true);
    expect(typeof result.current.clearNewQuestions).toBe('function');
  });

  it('should handle undefined productId', () => {
    const { result } = renderHook(() => useLiveQA(undefined));

    expect(result.current.newQuestions).toEqual([]);
    expect(result.current.newAnswers).toEqual([]);
  });
});
