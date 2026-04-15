import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import {
  useRewards,
  useLoyaltyTransactions,
  useLoyaltyStats,
  useCreateReward,
  useUpdateReward,
  useDeleteReward,
  useAdjustPoints,
} from './useLoyalty'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useRewards', () => {
  it('fetches rewards', async () => {
    const { result } = renderHook(() => useRewards(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useLoyaltyTransactions', () => {
  it('fetches transactions', async () => {
    const { result } = renderHook(() => useLoyaltyTransactions(), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useLoyaltyStats', () => {
  it('fetches loyalty stats', async () => {
    const { result } = renderHook(() => useLoyaltyStats(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useCreateReward', () => {
  it('creates a reward', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCreateReward(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate({ name: 'Test', description: 'Test reward', points_required: 100 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useUpdateReward', () => {
  it('updates a reward', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useUpdateReward(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate({
      id: 'reward-1',
      body: { name: 'Updated', description: 'Updated', points_required: 200 },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteReward', () => {
  it('deletes a reward', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useDeleteReward(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate('reward-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useAdjustPoints', () => {
  it('adjusts points', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useAdjustPoints(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate({ user_id: 'user-1', points: 100, description: 'Bonus' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
