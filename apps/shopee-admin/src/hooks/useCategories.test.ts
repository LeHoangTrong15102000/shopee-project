import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from 'src/test-utils';
import { useCategories, useCreateCategory, useDeleteCategory } from './useCategories';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('useCategories', () => {
  it('fetches categories', async () => {
    const { result } = renderHook(() => useCategories(), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

describe('useCreateCategory', () => {
  it('creates a category', async () => {
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createQueryWrapper() });
    result.current.mutate({ name: 'New Category' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDeleteCategory', () => {
  it('deletes a category', async () => {
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createQueryWrapper() });
    result.current.mutate('cat-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
