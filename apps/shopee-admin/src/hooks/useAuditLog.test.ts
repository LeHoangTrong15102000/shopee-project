import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useAuditLogList, useAuditLogDetail } from './useAuditLog'
import { server } from '../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

describe('useAuditLogList', () => {
  it('fetches audit log list', async () => {
    const { result } = renderHook(() => useAuditLogList(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toBeDefined()
    expect(Array.isArray(result.current.data?.items)).toBe(true)
  })

  it('fetches with status filter', async () => {
    const { result } = renderHook(() => useAuditLogList({ status: 'success' }), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toBeDefined()
  })

  it('fetches with pagination params', async () => {
    const { result } = renderHook(() => useAuditLogList({ page: 1, limit: 10 }), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pagination).toBeDefined()
    expect(result.current.data?.pagination.page).toBe(1)
  })

  it('fetches with action filter', async () => {
    const { result } = renderHook(() => useAuditLogList({ action: 'user.login' }), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toBeDefined()
  })

  it('returns pagination metadata', async () => {
    const { result } = renderHook(() => useAuditLogList({ page: 1, limit: 5 }), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const pagination = result.current.data?.pagination
    expect(pagination?.total).toBeGreaterThan(0)
    expect(pagination?.totalPages).toBeGreaterThan(0)
  })

  it('handles API error', async () => {
    server.use(
      http.get(`${API_URL}/admin/audit-logs`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    const { result } = renderHook(() => useAuditLogList(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useAuditLogDetail', () => {
  it('fetches audit log detail by id', async () => {
    const { result } = renderHook(() => useAuditLogDetail('audit-001'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?._id).toBe('audit-001')
    expect(result.current.data?.action).toBeDefined()
  })

  it('returns entry with diff data when available', async () => {
    const { result } = renderHook(() => useAuditLogDetail('audit-003'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.before).toBeDefined()
    expect(result.current.data?.after).toBeDefined()
    expect(result.current.data?.diff).toBeDefined()
  })

  it('handles 404 for unknown id', async () => {
    server.use(
      http.get(`${API_URL}/admin/audit-logs/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    const { result } = renderHook(() => useAuditLogDetail('nonexistent'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('does not fetch when id is undefined', () => {
    const { result } = renderHook(() => useAuditLogDetail(undefined), {
      wrapper: createQueryWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
  })
})
