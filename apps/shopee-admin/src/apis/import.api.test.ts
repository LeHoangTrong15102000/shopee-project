import { describe, it, expect, vi, beforeEach } from 'vitest'
import importApi from './import.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('import.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('importProducts calls POST /admin/import/products', () => {
    const file = new File(['test'], 'products.csv', { type: 'text/csv' })
    importApi.importProducts(file)
    expect(mockHttp.post).toHaveBeenCalledWith('admin/import/products', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })

  it('getImportStats calls GET /admin/import/products/stats', () => {
    importApi.getImportStats()
    expect(mockHttp.get).toHaveBeenCalledWith('admin/import/products/stats')
  })
})
