import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchHistory } from '../useSearchHistory';

describe('useSearchHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty history', () => {
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.searchHistory).toHaveLength(0);
  });

  it('adds search term to history', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory('iphone');
    });

    expect(result.current.searchHistory).toHaveLength(1);
    expect(result.current.searchHistory[0].query).toBe('iphone');
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory('samsung');
    });

    const stored = localStorage.getItem('shopee_search_history');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].query).toBe('samsung');
  });

  it('removes duplicate entries (case-insensitive)', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory('iPhone');
      result.current.addToHistory('iphone');
    });

    expect(result.current.searchHistory).toHaveLength(1);
    expect(result.current.searchHistory[0].query).toBe('iphone');
  });

  it('removes a specific item from history', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory('iphone');
      result.current.addToHistory('samsung');
    });

    expect(result.current.searchHistory).toHaveLength(2);

    act(() => {
      result.current.removeFromHistory('iphone');
    });

    expect(result.current.searchHistory).toHaveLength(1);
    expect(result.current.searchHistory[0].query).toBe('samsung');
  });

  it('clears all history', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory('test1');
      result.current.addToHistory('test2');
    });

    expect(result.current.searchHistory).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.searchHistory).toHaveLength(0);
    expect(localStorage.getItem('shopee_search_history')).toBeNull();
  });

  it('ignores empty search terms', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory('');
      result.current.addToHistory('   ');
    });

    expect(result.current.searchHistory).toHaveLength(0);
  });

  it('limits history to MAX_HISTORY_ITEMS (10)', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.addToHistory(`search-${i}`);
      }
    });

    expect(result.current.searchHistory.length).toBe(10);
  });
});
