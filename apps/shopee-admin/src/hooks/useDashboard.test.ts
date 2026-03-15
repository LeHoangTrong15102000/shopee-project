import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from 'src/test-utils';
import {
  useDashboardOverview,
  useDashboardRevenue,
  useDashboardOrderTrend,
  useDashboardUserGrowth,
  useDashboardTopProducts,
} from './useDashboard';

describe('useDashboardOverview', () => {
  it('fetches dashboard overview', async () => {
    const { result } = renderHook(() => useDashboardOverview(), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total_revenue).toBeDefined();
    expect(result.current.data?.total_orders).toBeDefined();
  });
});

describe('useDashboardRevenue', () => {
  it('fetches revenue data', async () => {
    const { result } = renderHook(() => useDashboardRevenue('7d'), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

describe('useDashboardOrderTrend', () => {
  it('fetches order trends', async () => {
    const { result } = renderHook(() => useDashboardOrderTrend('7d'), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

describe('useDashboardUserGrowth', () => {
  it('fetches user growth', async () => {
    const { result } = renderHook(() => useDashboardUserGrowth('7d'), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

describe('useDashboardTopProducts', () => {
  it('fetches top products', async () => {
    const { result } = renderHook(() => useDashboardTopProducts('7d'), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
