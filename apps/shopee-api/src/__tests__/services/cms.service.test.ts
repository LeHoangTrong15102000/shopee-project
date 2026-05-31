/// <reference types="jest" />
import { Types } from 'mongoose'
import { CmsService } from '@services/cms.service'
import { ConflictError, NotFoundError, ValidationError } from '@services/base.service'
import type { IPage, IPageBlock } from '@database/models/page.model'

// ─── Mock ProductModel and CategoryModel ─────────────────────────────────────

const mockProductFind = jest.fn()
const mockCategoryFind = jest.fn()

jest.mock('@database/models/product.model', () => ({
  ProductModel: {
    find: (...args: unknown[]) => mockProductFind(...args),
  },
}))

jest.mock('@database/models/category.model', () => ({
  CategoryModel: {
    find: (...args: unknown[]) => mockCategoryFind(...args),
  },
}))

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiWarn: jest.fn(), apiError: jest.fn() },
}))

// ─── Mock PageRepository ──────────────────────────────────────────────────────

const mockPageRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePage(overrides: Partial<IPage> = {}): IPage {
  return {
    _id: new Types.ObjectId(),
    slug: 'test-page',
    title: 'Test Page',
    status: 'draft',
    blocks: [],
    meta: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
    ...overrides,
  } as unknown as IPage
}

function makeBlock(type: string, data: Record<string, unknown> = {}): IPageBlock {
  return { type, data } as IPageBlock
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CmsService', () => {
  let service: CmsService

  beforeEach(() => {
    jest.clearAllMocks()
    // Default lean() chain for ProductModel.find
    mockProductFind.mockReturnValue({ sort: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }) })
    mockCategoryFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    service = new CmsService(mockPageRepo as never)
  })

  // ─── createPage ─────────────────────────────────────────────────────────────

  describe('createPage', () => {
    it('creates a page when slug is unique', async () => {
      const page = makePage()
      mockPageRepo.findBySlug.mockResolvedValue(null)
      mockPageRepo.create.mockResolvedValue(page)

      const result = await service.createPage({ slug: 'test-page', title: 'Test Page' })

      expect(mockPageRepo.findBySlug).toHaveBeenCalledWith('test-page')
      expect(mockPageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'test-page', title: 'Test Page', blocks: [], meta: {} }),
      )
      expect(result).toBe(page)
    })

    it('throws ConflictError when slug already exists', async () => {
      mockPageRepo.findBySlug.mockResolvedValue(makePage())

      await expect(service.createPage({ slug: 'test-page', title: 'Test' })).rejects.toThrow(
        ConflictError,
      )
      expect(mockPageRepo.create).not.toHaveBeenCalled()
    })

    it('defaults blocks to [] and meta to {} when not provided', async () => {
      mockPageRepo.findBySlug.mockResolvedValue(null)
      mockPageRepo.create.mockResolvedValue(makePage())

      await service.createPage({ slug: 'new-page', title: 'New Page' })

      expect(mockPageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ blocks: [], meta: {} }),
      )
    })
  })

  // ─── getPage ─────────────────────────────────────────────────────────────────

  describe('getPage', () => {
    it('returns page for valid ID', async () => {
      const id = new Types.ObjectId().toString()
      const page = makePage()
      mockPageRepo.findById.mockResolvedValue(page)

      const result = await service.getPage(id)
      expect(result).toBe(page)
    })

    it('throws ValidationError for invalid ObjectId', async () => {
      await expect(service.getPage('not-an-id')).rejects.toThrow(ValidationError)
    })

    it('throws NotFoundError when page does not exist', async () => {
      const id = new Types.ObjectId().toString()
      mockPageRepo.findById.mockResolvedValue(null)

      await expect(service.getPage(id)).rejects.toThrow(NotFoundError)
    })
  })

  // ─── publishPage / unpublishPage ─────────────────────────────────────────────

  describe('publishPage', () => {
    it('sets status to published and records publishedAt', async () => {
      const id = new Types.ObjectId().toString()
      const published = makePage({ status: 'published', publishedAt: new Date() })
      mockPageRepo.update.mockResolvedValue(published)

      const result = await service.publishPage(id)

      expect(mockPageRepo.update).toHaveBeenCalledWith(
        id,
        expect.objectContaining({ status: 'published', publishedAt: expect.any(Date) }),
      )
      expect(result.status).toBe('published')
    })

    it('throws NotFoundError when page does not exist', async () => {
      const id = new Types.ObjectId().toString()
      mockPageRepo.update.mockResolvedValue(null)

      await expect(service.publishPage(id)).rejects.toThrow(NotFoundError)
    })
  })

  describe('unpublishPage', () => {
    it('sets status back to draft and clears publishedAt', async () => {
      const id = new Types.ObjectId().toString()
      const draft = makePage({ status: 'draft', publishedAt: null })
      mockPageRepo.update.mockResolvedValue(draft)

      const result = await service.unpublishPage(id)

      expect(mockPageRepo.update).toHaveBeenCalledWith(
        id,
        expect.objectContaining({ status: 'draft', publishedAt: null }),
      )
      expect(result.status).toBe('draft')
    })
  })

  // ─── updatePage slug uniqueness ───────────────────────────────────────────────

  describe('updatePage', () => {
    it('throws ConflictError when new slug belongs to a different page', async () => {
      const id = new Types.ObjectId().toString()
      const otherId = new Types.ObjectId().toString()
      mockPageRepo.findBySlug.mockResolvedValue(makePage({ _id: new Types.ObjectId(otherId) }))

      await expect(service.updatePage(id, { slug: 'taken-slug' })).rejects.toThrow(ConflictError)
    })

    it('allows updating slug to the same page own slug', async () => {
      const oid = new Types.ObjectId()
      const id = oid.toString()
      const page = makePage({ _id: oid, slug: 'my-slug' })
      mockPageRepo.findBySlug.mockResolvedValue(page)
      mockPageRepo.update.mockResolvedValue(page)

      const result = await service.updatePage(id, { slug: 'my-slug' })
      expect(result).toBe(page)
    })
  })

  // ─── resolveBlocks ────────────────────────────────────────────────────────────

  describe('resolveBlocks', () => {
    it('passes non-carousel/non-grid blocks through unchanged', async () => {
      const bannerBlock = makeBlock('banner', { imageUrl: 'https://example.com/img.jpg' })
      const heroBlock = makeBlock('hero', { title: 'Welcome' })

      const result = await service.resolveBlocks([bannerBlock, heroBlock])

      expect(result).toHaveLength(2)
      expect(result[0]).toBe(bannerBlock)
      expect(result[1]).toBe(heroBlock)
      // No DB calls needed for pass-through blocks
      expect(mockProductFind).not.toHaveBeenCalled()
      expect(mockCategoryFind).not.toHaveBeenCalled()
    })

    it('batches multiple product_carousel static productIds into a single ProductModel.find call', async () => {
      const pid1 = new Types.ObjectId()
      const pid2 = new Types.ObjectId()
      const pid3 = new Types.ObjectId()

      const product1 = { _id: pid1, name: 'P1' }
      const product2 = { _id: pid2, name: 'P2' }
      const product3 = { _id: pid3, name: 'P3' }

      // ProductModel.find returns a lean() result directly (no sort/limit for static)
      mockProductFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([product1, product2, product3]),
      })

      const carousel1 = makeBlock('product_carousel', { productIds: [pid1.toString(), pid2.toString()] })
      const carousel2 = makeBlock('product_carousel', { productIds: [pid2.toString(), pid3.toString()] })

      const result = await service.resolveBlocks([carousel1, carousel2])

      // Only ONE ProductModel.find call for all static productIds
      expect(mockProductFind).toHaveBeenCalledTimes(1)
      expect(result).toHaveLength(2)

      // Each carousel gets its own resolved products from the shared map
      const r1 = result[0] as { resolvedProducts: unknown[] }
      const r2 = result[1] as { resolvedProducts: unknown[] }
      expect(r1.resolvedProducts).toHaveLength(2)
      expect(r2.resolvedProducts).toHaveLength(2)
    })

    it('executes per-block query for product_carousel with query field', async () => {
      const queryProducts = [{ _id: new Types.ObjectId(), name: 'Bestseller' }]
      const sortMock = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(queryProducts) }),
      })
      mockProductFind.mockReturnValue({ sort: sortMock })

      const queryCarousel = makeBlock('product_carousel', {
        query: { type: 'bestseller', limit: 5 },
      })

      const result = await service.resolveBlocks([queryCarousel])

      expect(mockProductFind).toHaveBeenCalledTimes(1)
      expect(sortMock).toHaveBeenCalledWith({ sold: -1 })
      const r = result[0] as { resolvedProducts: unknown[] }
      expect(r.resolvedProducts).toEqual(queryProducts)
    })

    it('batches category_grid categoryIds into a single CategoryModel.find call', async () => {
      const cid1 = new Types.ObjectId()
      const cid2 = new Types.ObjectId()
      const cat1 = { _id: cid1, name: 'Electronics' }
      const cat2 = { _id: cid2, name: 'Clothing' }

      mockCategoryFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([cat1, cat2]) })

      const grid1 = makeBlock('category_grid', { categoryIds: [cid1.toString()] })
      const grid2 = makeBlock('category_grid', { categoryIds: [cid2.toString()] })

      const result = await service.resolveBlocks([grid1, grid2])

      // Only ONE CategoryModel.find call
      expect(mockCategoryFind).toHaveBeenCalledTimes(1)
      expect(result).toHaveLength(2)
    })

    it('returns empty array for empty blocks input', async () => {
      const result = await service.resolveBlocks([])
      expect(result).toEqual([])
      expect(mockProductFind).not.toHaveBeenCalled()
      expect(mockCategoryFind).not.toHaveBeenCalled()
    })

    it('deduplicates productIds across multiple carousels before querying', async () => {
      const pid = new Types.ObjectId()
      const product = { _id: pid, name: 'Shared Product' }

      mockProductFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([product]),
      })

      // Both carousels reference the same productId
      const carousel1 = makeBlock('product_carousel', { productIds: [pid.toString()] })
      const carousel2 = makeBlock('product_carousel', { productIds: [pid.toString()] })

      await service.resolveBlocks([carousel1, carousel2])

      // The $in array should contain the pid only once
      const callArg = mockProductFind.mock.calls[0][0] as { _id: { $in: Types.ObjectId[] } }
      expect(callArg._id.$in).toHaveLength(1)
    })

    it('handles mixed block types in a single call', async () => {
      const pid = new Types.ObjectId()
      const cid = new Types.ObjectId()

      mockProductFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: pid, name: 'P' }]),
      })
      mockCategoryFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: cid, name: 'C' }]),
      })

      const blocks = [
        makeBlock('banner', { imageUrl: 'img.jpg' }),
        makeBlock('product_carousel', { productIds: [pid.toString()] }),
        makeBlock('category_grid', { categoryIds: [cid.toString()] }),
        makeBlock('hero', { title: 'Hi' }),
      ]

      const result = await service.resolveBlocks(blocks)

      expect(result).toHaveLength(4)
      expect(mockProductFind).toHaveBeenCalledTimes(1)
      expect(mockCategoryFind).toHaveBeenCalledTimes(1)
    })
  })
})
