import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from './useUsers'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useUsers', () => {
  it('fetches users with pagination', async () => {
    const { result } = renderHook(() => useUsers(0), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useCreateUser', () => {
  it('creates a user', async () => {
    const { result } = renderHook(() => useCreateUser(), { wrapper: createQueryWrapper() })
    result.current.mutate({ email: 'new@example.com', password: 'password123' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useUpdateUser', () => {
  it('updates a user', async () => {
    const { result } = renderHook(() => useUpdateUser(), { wrapper: createQueryWrapper() })
    result.current.mutate({ id: 'user-2', body: { name: 'Updated Name' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteUser', () => {
  it('deletes a user', async () => {
    const { result } = renderHook(() => useDeleteUser(), { wrapper: createQueryWrapper() })
    result.current.mutate('user-2')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
