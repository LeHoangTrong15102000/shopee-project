/// <reference types="jest" />

/**
 * Unit tests for SearchSyncWorker.
 * Mocks BullMQ Worker, MeilisearchService, ProductModel, and CategoryModel.
 */

// ── Mock BullMQ Worker so no real Redis connection is made ──────────────────
let capturedProcessor:
  | ((job: { id: string; data: Record<string, unknown> }) => Promise<void>)
  | null = null

const mockWorkerInstance = {
  on: jest.fn(),
}

jest.mock('bullmq', () => ({
  Worker: jest
    .fn()
    .mockImplementation((_queue: string, processor: (...args: unknown[]) => unknown) => {
      capturedProcessor = processor as typeof capturedProcessor
      return mockWorkerInstance
    }),
}))

// ── Mock worker connection helper ───────────────────────────────────────────
jest.mock('../../workers/worker.connection', () => ({
  getWorkerConnection: jest.fn().mockReturnValue({}),
}))

// ── Mock ProductModel ────────────────────────────────────────────────────────
const mockProductFindById = jest.fn()

jest.mock('@database/models/product.model', () => ({
  ProductModel: {
    findById: jest.fn().mockImplementation((id: string) => mockProductFindById(id)),
    find: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
  },
}))

// ── Mock CategoryModel ───────────────────────────────────────────────────────
const mockCategoryFindById = jest.fn()

jest.mock('@database/models/category.model', () => ({
  CategoryModel: {
    findById: jest.fn().mockImplementation((id: string) => mockCategoryFindById(id)),
  },
}))

// ── Mock MeilisearchService ──────────────────────────────────────────────────
const mockUpsertProduct = jest.fn()
const mockDeleteProduct = jest.fn()
const mockReindexAll = jest.fn()

const mockMeilisearchService = {
  upsertProduct: mockUpsertProduct,
  deleteProduct: mockDeleteProduct,
  reindexAll: mockReindexAll,
}

// ── Import after mocks ───────────────────────────────────────────────────────
import { SearchSyncWorker } from '../../workers/search-sync.worker'
import { Types } from 'mongoose'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeJob(data: Record<string, unknown>) {
  return { id: 'job-1', data }
}

const sampleProductId = new Types.ObjectId().toString()
const sampleCategoryId = new Types.ObjectId().toString()

const sampleProduct = {
  _id: new Types.ObjectId(sampleProductId),
  name: 'Test Product',
  description: 'A test product',
  category: new Types.ObjectId(sampleCategoryId),
  price: 100000,
  rating: 4.5,
  sold: 50,
  quantity: 10,
  image: 'test.jpg',
  images: ['test.jpg'],
  shop_id: new Types.ObjectId(),
  createdAt: new Date('2024-01-01'),
}

const sampleCategory = {
  _id: new Types.ObjectId(sampleCategoryId),
  name: 'Electronics',
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SearchSyncWorker', () => {
  let worker: SearchSyncWorker

  beforeEach(() => {
    jest.clearAllMocks()
    capturedProcessor = null
    worker = new SearchSyncWorker(mockMeilisearchService as any)
  })

  it('registers event handlers on the BullMQ worker', () => {
    expect(mockWorkerInstance.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(mockWorkerInstance.on).toHaveBeenCalledWith('failed', expect.any(Function))
  })

  describe('product.created / product.updated (operation: index)', () => {
    it('calls upsertProduct with a denormalized document', async () => {
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(sampleProduct) })
      mockCategoryFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(sampleCategory) })
      mockUpsertProduct.mockResolvedValue(undefined)

      await capturedProcessor!(
        makeJob({
          entityType: 'product',
          entityId: sampleProductId,
          operation: 'index',
        }),
      )

      expect(mockUpsertProduct).toHaveBeenCalledTimes(1)
      const doc = mockUpsertProduct.mock.calls[0][0]
      expect(doc.id).toBe(sampleProductId)
      expect(doc.name).toBe('Test Product')
      expect(doc.category_id).toBe(sampleCategoryId)
      expect(doc.category_name).toBe('Electronics')
      expect(doc.price).toBe(100000)
      expect(doc.stock_status).toBe('in_stock')
    })

    it('sets stock_status to out_of_stock when quantity is 0', async () => {
      const outOfStockProduct = { ...sampleProduct, quantity: 0 }
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(outOfStockProduct) })
      mockCategoryFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(sampleCategory) })
      mockUpsertProduct.mockResolvedValue(undefined)

      await capturedProcessor!(
        makeJob({
          entityType: 'product',
          entityId: sampleProductId,
          operation: 'index',
        }),
      )

      const doc = mockUpsertProduct.mock.calls[0][0]
      expect(doc.stock_status).toBe('out_of_stock')
    })

    it('skips upsert when product is not found', async () => {
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) })

      await capturedProcessor!(
        makeJob({
          entityType: 'product',
          entityId: sampleProductId,
          operation: 'index',
        }),
      )

      expect(mockUpsertProduct).not.toHaveBeenCalled()
    })

    it('uses empty string for category_name when category is not found', async () => {
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(sampleProduct) })
      mockCategoryFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) })
      mockUpsertProduct.mockResolvedValue(undefined)

      await capturedProcessor!(
        makeJob({
          entityType: 'product',
          entityId: sampleProductId,
          operation: 'index',
        }),
      )

      const doc = mockUpsertProduct.mock.calls[0][0]
      expect(doc.category_name).toBe('')
    })
  })

  describe('product.deleted (operation: delete)', () => {
    it('calls deleteProduct with the entity ID', async () => {
      mockDeleteProduct.mockResolvedValue(undefined)

      await capturedProcessor!(
        makeJob({
          entityType: 'product',
          entityId: sampleProductId,
          operation: 'delete',
        }),
      )

      expect(mockDeleteProduct).toHaveBeenCalledWith(sampleProductId)
      expect(mockUpsertProduct).not.toHaveBeenCalled()
    })
  })

  describe('unknown entityType', () => {
    it('skips processing for unknown entity types', async () => {
      await capturedProcessor!(
        makeJob({
          entityType: 'category',
          entityId: 'cat-1',
          operation: 'index',
        }),
      )

      expect(mockUpsertProduct).not.toHaveBeenCalled()
      expect(mockDeleteProduct).not.toHaveBeenCalled()
    })
  })
})
