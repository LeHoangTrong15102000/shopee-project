/// <reference types="jest" />

/**
 * Unit tests for MeilisearchService.
 * Mocks the meilisearch JS client — no real Meilisearch instance required.
 */

const mockAddDocuments = jest.fn()
const mockDeleteDocument = jest.fn()
const mockSearch = jest.fn()
const mockUpdateSearchableAttributes = jest.fn()
const mockUpdateFilterableAttributes = jest.fn()
const mockUpdateSortableAttributes = jest.fn()

const mockIndex = {
  addDocuments: mockAddDocuments,
  deleteDocument: mockDeleteDocument,
  search: mockSearch,
  updateSearchableAttributes: mockUpdateSearchableAttributes,
  updateFilterableAttributes: mockUpdateFilterableAttributes,
  updateSortableAttributes: mockUpdateSortableAttributes,
}

jest.mock('meilisearch', () => ({
  MeiliSearch: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue(mockIndex),
  })),
}))

import { MeilisearchService, ProductDocument } from '@services/meilisearch.service'

const sampleDoc: ProductDocument = {
  id: 'prod-1',
  name: 'iPhone 15',
  description: 'Latest iPhone',
  category_id: 'cat-1',
  category_name: 'Điện thoại',
  price: 25000000,
  rating: 4.8,
  sold_count: 100,
  stock: 50,
  stock_status: 'in_stock',
}

describe('MeilisearchService', () => {
  let service: MeilisearchService

  beforeEach(() => {
    service = new MeilisearchService('http://localhost:7700', 'test-key')
    jest.clearAllMocks()
  })

  // ─── configureIndex ───────────────────────────────────────────────

  describe('configureIndex', () => {
    it('calls updateSearchableAttributes, updateFilterableAttributes, updateSortableAttributes', async () => {
      mockUpdateSearchableAttributes.mockResolvedValue({})
      mockUpdateFilterableAttributes.mockResolvedValue({})
      mockUpdateSortableAttributes.mockResolvedValue({})

      await service.configureIndex()

      expect(mockUpdateSearchableAttributes).toHaveBeenCalledWith([
        'name',
        'description',
        'category_name',
        'tags',
      ])
      expect(mockUpdateFilterableAttributes).toHaveBeenCalledWith([
        'category_id',
        'price',
        'rating',
        'stock_status',
        'shop_id',
      ])
      expect(mockUpdateSortableAttributes).toHaveBeenCalledWith([
        'price',
        'rating',
        'sold_count',
        'createdAt',
      ])
    })

    it('does not throw when Meilisearch is unavailable (non-fatal)', async () => {
      mockUpdateSearchableAttributes.mockRejectedValue(new Error('Connection refused'))

      await expect(service.configureIndex()).resolves.not.toThrow()
    })
  })

  // ─── upsertProduct ────────────────────────────────────────────────

  describe('upsertProduct', () => {
    it('calls addDocuments with the product document', async () => {
      mockAddDocuments.mockResolvedValue({ taskUid: 1 })

      await service.upsertProduct(sampleDoc)

      expect(mockAddDocuments).toHaveBeenCalledWith([sampleDoc], { primaryKey: 'id' })
    })

    it('throws when addDocuments fails', async () => {
      mockAddDocuments.mockRejectedValue(new Error('Index error'))

      await expect(service.upsertProduct(sampleDoc)).rejects.toThrow('Index error')
    })
  })

  // ─── deleteProduct ────────────────────────────────────────────────

  describe('deleteProduct', () => {
    it('calls deleteDocument with the product ID', async () => {
      mockDeleteDocument.mockResolvedValue({ taskUid: 2 })

      await service.deleteProduct('prod-1')

      expect(mockDeleteDocument).toHaveBeenCalledWith('prod-1')
    })

    it('throws when deleteDocument fails', async () => {
      mockDeleteDocument.mockRejectedValue(new Error('Not found'))

      await expect(service.deleteProduct('prod-1')).rejects.toThrow('Not found')
    })
  })

  // ─── search ───────────────────────────────────────────────────────

  describe('search', () => {
    it('returns mapped result with hits, totalHits, facets, processingTimeMs', async () => {
      mockSearch.mockResolvedValue({
        hits: [sampleDoc],
        estimatedTotalHits: 1,
        facetDistribution: { category_id: { 'cat-1': 1 } },
        processingTimeMs: 5,
      })

      const result = await service.search({ q: 'iphone', page: 1, limit: 20 })

      expect(result.hits).toHaveLength(1)
      expect(result.totalHits).toBe(1)
      expect(result.facets).toEqual({ category_id: { 'cat-1': 1 } })
      expect(result.processingTimeMs).toBe(5)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('passes filter string when category is provided', async () => {
      mockSearch.mockResolvedValue({
        hits: [],
        estimatedTotalHits: 0,
        facetDistribution: {},
        processingTimeMs: 2,
      })

      await service.search({ q: 'phone', category: 'cat-1' })

      const callArgs = mockSearch.mock.calls[0]
      expect(callArgs[1].filter).toContain('category_id = "cat-1"')
    })

    it('passes price range filter when minPrice and maxPrice are provided', async () => {
      mockSearch.mockResolvedValue({
        hits: [],
        estimatedTotalHits: 0,
        facetDistribution: {},
        processingTimeMs: 2,
      })

      await service.search({ minPrice: 100, maxPrice: 500 })

      const callArgs = mockSearch.mock.calls[0]
      expect(callArgs[1].filter).toContain('price >= 100')
      expect(callArgs[1].filter).toContain('price <= 500')
    })

    it('calculates correct offset from page and limit', async () => {
      mockSearch.mockResolvedValue({
        hits: [],
        estimatedTotalHits: 0,
        facetDistribution: {},
        processingTimeMs: 1,
      })

      await service.search({ page: 3, limit: 10 })

      const callArgs = mockSearch.mock.calls[0]
      expect(callArgs[1].offset).toBe(20) // (3-1) * 10
      expect(callArgs[1].limit).toBe(10)
    })
  })

  // ─── suggest ──────────────────────────────────────────────────────

  describe('suggest', () => {
    it('returns deduplicated product names', async () => {
      mockSearch.mockResolvedValue({
        hits: [
          { name: 'iPhone 15' },
          { name: 'iPhone 14' },
          { name: 'iPhone 15' }, // duplicate
        ],
      })

      const result = await service.suggest('iphone')

      expect(result).toHaveLength(2)
      expect(result).toContain('iPhone 15')
      expect(result).toContain('iPhone 14')
    })

    it('returns empty array for empty prefix', async () => {
      const result = await service.suggest('')
      expect(result).toEqual([])
      expect(mockSearch).not.toHaveBeenCalled()
    })
  })

  // ─── buildFilterString ────────────────────────────────────────────

  describe('buildFilterString', () => {
    it('returns empty string when no filters', () => {
      expect(service.buildFilterString({})).toBe('')
    })

    it('builds category filter', () => {
      expect(service.buildFilterString({ category: 'cat-1' })).toBe('category_id = "cat-1"')
    })

    it('builds price range filter', () => {
      const result = service.buildFilterString({ minPrice: 100, maxPrice: 500 })
      expect(result).toBe('price >= 100 AND price <= 500')
    })

    it('builds minPrice-only filter', () => {
      expect(service.buildFilterString({ minPrice: 100 })).toBe('price >= 100')
    })

    it('builds maxPrice-only filter', () => {
      expect(service.buildFilterString({ maxPrice: 500 })).toBe('price <= 500')
    })

    it('builds rating filter', () => {
      expect(service.buildFilterString({ rating: 4 })).toBe('rating >= 4')
    })

    it('combines multiple filters with AND', () => {
      const result = service.buildFilterString({ category: 'cat-1', minPrice: 100, rating: 4 })
      expect(result).toContain('category_id = "cat-1"')
      expect(result).toContain('price >= 100')
      expect(result).toContain('rating >= 4')
    })
  })

  // ─── buildSortArray ───────────────────────────────────────────────

  describe('buildSortArray', () => {
    it('returns empty array for undefined sort', () => {
      expect(service.buildSortArray(undefined)).toEqual([])
    })

    it('returns empty array for unknown sort value', () => {
      expect(service.buildSortArray('unknown:asc')).toEqual([])
    })

    it('maps price:asc correctly', () => {
      expect(service.buildSortArray('price:asc')).toEqual(['price:asc'])
    })

    it('maps rating:desc correctly', () => {
      expect(service.buildSortArray('rating:desc')).toEqual(['rating:desc'])
    })

    it('maps sold_count:desc correctly', () => {
      expect(service.buildSortArray('sold_count:desc')).toEqual(['sold_count:desc'])
    })
  })

  // ─── reindexAll ───────────────────────────────────────────────────

  describe('reindexAll', () => {
    it('does nothing for empty array', async () => {
      await service.reindexAll([])
      expect(mockAddDocuments).not.toHaveBeenCalled()
    })

    it('calls addDocuments for a batch of documents', async () => {
      mockAddDocuments.mockResolvedValue({ taskUid: 3 })
      const docs = Array.from({ length: 3 }, (_, i) => ({ ...sampleDoc, id: `prod-${i}` }))

      await service.reindexAll(docs)

      expect(mockAddDocuments).toHaveBeenCalledTimes(1)
      expect(mockAddDocuments).toHaveBeenCalledWith(docs, { primaryKey: 'id' })
    })

    it('batches documents in groups of 500', async () => {
      mockAddDocuments.mockResolvedValue({ taskUid: 4 })
      const docs = Array.from({ length: 1100 }, (_, i) => ({ ...sampleDoc, id: `prod-${i}` }))

      await service.reindexAll(docs)

      // 1100 docs / 500 per batch = 3 calls
      expect(mockAddDocuments).toHaveBeenCalledTimes(3)
    })
  })
})
