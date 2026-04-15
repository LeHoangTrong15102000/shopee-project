import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useQuestions, useQAStats, useDeleteQuestion, useDeleteAnswer } from './useQA'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useQuestions', () => {
  it('fetches questions', async () => {
    const { result } = renderHook(() => useQuestions(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useQAStats', () => {
  it('fetches QA stats', async () => {
    const { result } = renderHook(() => useQAStats(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useDeleteQuestion', () => {
  it('deletes a question', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useDeleteQuestion(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate('qa-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteAnswer', () => {
  it('deletes an answer', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useDeleteAnswer(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate({ qId: 'qa-1', aId: 'ans-1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
