import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useInventoryAlerts from '../useInventoryAlerts';
import React from 'react';

vi.mock('../useSocket', () => ({
  default: vi.fn(() => ({ socket: null, isConnected: false })),
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('src/contexts/app.context', async () => {
  const React = await import('react');
  return {
    AppContext: React.createContext({ profile: null, isAuthenticated: false }),
  };
});

describe('useInventoryAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render and return expected shape', () => {
    const { result } = renderHook(() => useInventoryAlerts());

    expect(result.current).toHaveProperty('alerts');
    expect(result.current).toHaveProperty('unreadCount');
    expect(result.current).toHaveProperty('clearAlerts');
    expect(Array.isArray(result.current.alerts)).toBe(true);
    expect(typeof result.current.unreadCount).toBe('number');
    expect(typeof result.current.clearAlerts).toBe('function');
  });

  it('should initialize with empty alerts', () => {
    const { result } = renderHook(() => useInventoryAlerts());

    expect(result.current.alerts).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});
