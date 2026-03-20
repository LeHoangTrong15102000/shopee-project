import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnimationConfig, useCanAnimate } from '../useAnimationConfig';
import { useReducedMotion } from '../useReducedMotion';

vi.mock('../useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('useAnimationConfig', () => {
  it('returns normal animation config when motion is not reduced', () => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
    const variants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    const { result } = renderHook(() => useAnimationConfig(variants));

    expect(result.current.initial).toBe('hidden');
    expect(result.current.animate).toBe('visible');
    expect(result.current.exit).toBe('exit');
    expect(result.current.variants).toBe(variants);
    expect(result.current.transition).toBeUndefined();
  });

  it('returns reduced motion config when motion is reduced', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const variants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    const { result } = renderHook(() => useAnimationConfig(variants));

    expect(result.current.initial).toBe(false);
    expect(result.current.animate).toBe('visible');
    expect(result.current.transition).toEqual({ duration: 0 });
    // Variants should be empty objects
    expect(result.current.variants?.hidden).toEqual({});
    expect(result.current.variants?.visible).toEqual({});
  });

  it('handles custom exit variant', () => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
    const variants = { hidden: {}, visible: {} };
    const { result } = renderHook(() =>
      useAnimationConfig(variants, { exitVariant: 'customExit' }),
    );
    expect(result.current.exit).toBe('customExit');
  });

  it('handles custom exit variant with reduced motion', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const variants = { hidden: {}, visible: {} };
    const { result } = renderHook(() =>
      useAnimationConfig(variants, { exitVariant: 'customExit' }),
    );
    expect(result.current.exit).toBe('customExit');
  });

  it('defaults exit to "exit" when no exitVariant provided', () => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
    const variants = { hidden: {}, visible: {} };
    const { result } = renderHook(() => useAnimationConfig(variants));
    expect(result.current.exit).toBe('exit');
  });
});

describe('useCanAnimate', () => {
  it('returns true when motion is not reduced', () => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
    const { result } = renderHook(() => useCanAnimate());
    expect(result.current).toBe(true);
  });

  it('returns false when motion is reduced', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const { result } = renderHook(() => useCanAnimate());
    expect(result.current).toBe(false);
  });
});
