import { describe, it, expect, vi, beforeEach } from 'vitest'
import qaApi from './qa.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('qa.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getQuestions calls GET /admin/qa/questions with params', () => {
    qaApi.getQuestions({ page: 1, limit: 10, unanswered: 'true' })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/qa/questions', {
      params: { page: 1, limit: 10, unanswered: 'true' },
    })
  })

  it('getQAStats calls GET /admin/qa/stats', () => {
    qaApi.getQAStats()
    expect(mockHttp.get).toHaveBeenCalledWith('admin/qa/stats')
  })

  it('deleteQuestion calls DELETE /admin/qa/questions/:id', () => {
    qaApi.deleteQuestion('q-1')
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/qa/questions/q-1')
  })

  it('deleteAnswer calls DELETE /admin/qa/questions/:qId/answers/:aId', () => {
    qaApi.deleteAnswer('q-1', 'a-1')
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/qa/questions/q-1/answers/a-1')
  })
})
