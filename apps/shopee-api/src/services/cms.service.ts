import { Types } from 'mongoose'
import { IPage, IPageBlock } from '@database/models/page.model'
import {
  PageRepository,
  CreatePageDTO,
  UpdatePageDTO,
  PageFilter,
} from '@repositories/page.repository'
import { BaseService, NotFoundError, ConflictError, ValidationError } from './base.service'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'

// ─── Resolved block types ─────────────────────────────────────────────────────

export interface ResolvedProductCarouselBlock extends IPageBlock {
  type: 'product_carousel'
  resolvedProducts?: unknown[]
}

export interface ResolvedCategoryGridBlock extends IPageBlock {
  type: 'category_grid'
  resolvedCategories?: unknown[]
}

export type ResolvedBlock = IPageBlock | ResolvedProductCarouselBlock | ResolvedCategoryGridBlock

// ─── Service input types ──────────────────────────────────────────────────────

export interface CreatePageInput {
  slug: string
  title: string
  blocks?: IPage['blocks']
  meta?: IPage['meta']
}

export interface UpdatePageInput {
  slug?: string
  title?: string
  blocks?: IPage['blocks']
  meta?: IPage['meta']
}

export interface ListPagesFilter {
  status?: 'draft' | 'published'
}

// ─── CmsService ───────────────────────────────────────────────────────────────

export class CmsService extends BaseService {
  constructor(private readonly pageRepository: PageRepository) {
    super()
  }

  /**
   * Create a new page. Throws ConflictError if slug already exists.
   */
  async createPage(input: CreatePageInput): Promise<IPage> {
    const existing = await this.pageRepository.findBySlug(input.slug)
    if (existing) {
      throw new ConflictError(`Page with slug '${input.slug}' already exists`)
    }

    const dto: CreatePageDTO = {
      slug: input.slug,
      title: input.title,
      blocks: input.blocks ?? [],
      meta: input.meta ?? {},
    }

    return this.pageRepository.create(dto)
  }

  /**
   * Get a page by MongoDB ID.
   */
  async getPage(id: string): Promise<IPage> {
    if (!this.isValidObjectId(id)) {
      throw new ValidationError('Invalid page ID format')
    }
    const page = await this.pageRepository.findById(id)
    if (!page) {
      throw new NotFoundError('Page', id)
    }
    return page
  }

  /**
   * Get a page by slug. Returns null if not found (callers decide 404 vs error).
   */
  async getPageBySlug(slug: string): Promise<IPage | null> {
    return this.pageRepository.findBySlug(slug)
  }

  /**
   * List pages with optional status filter.
   */
  async listPages(filter?: ListPagesFilter): Promise<IPage[]> {
    const repoFilter: PageFilter = {}
    if (filter?.status) {
      repoFilter.status = filter.status
    }
    return this.pageRepository.findAll(repoFilter)
  }

  /**
   * Update a page by ID. Throws ConflictError if new slug conflicts with another page.
   */
  async updatePage(id: string, input: UpdatePageInput): Promise<IPage> {
    if (!this.isValidObjectId(id)) {
      throw new ValidationError('Invalid page ID format')
    }

    // Check slug uniqueness if slug is being changed
    if (input.slug !== undefined) {
      const existing = await this.pageRepository.findBySlug(input.slug)
      if (existing && existing._id.toString() !== id) {
        throw new ConflictError(`Page with slug '${input.slug}' already exists`)
      }
    }

    const dto: UpdatePageDTO = {}
    if (input.slug !== undefined) dto.slug = input.slug
    if (input.title !== undefined) dto.title = input.title
    if (input.blocks !== undefined) dto.blocks = input.blocks
    if (input.meta !== undefined) dto.meta = input.meta

    const updated = await this.pageRepository.update(id, dto)
    if (!updated) {
      throw new NotFoundError('Page', id)
    }
    return updated
  }

  /**
   * Delete a page by ID.
   */
  async deletePage(id: string): Promise<void> {
    if (!this.isValidObjectId(id)) {
      throw new ValidationError('Invalid page ID format')
    }
    const deleted = await this.pageRepository.delete(id)
    if (!deleted) {
      throw new NotFoundError('Page', id)
    }
  }

  /**
   * Publish a page: set status to 'published' and record publishedAt.
   */
  async publishPage(id: string): Promise<IPage> {
    if (!this.isValidObjectId(id)) {
      throw new ValidationError('Invalid page ID format')
    }
    const updated = await this.pageRepository.update(id, {
      status: 'published',
      publishedAt: new Date(),
    })
    if (!updated) {
      throw new NotFoundError('Page', id)
    }
    return updated
  }

  /**
   * Unpublish a page: set status back to 'draft' and clear publishedAt.
   */
  async unpublishPage(id: string): Promise<IPage> {
    if (!this.isValidObjectId(id)) {
      throw new ValidationError('Invalid page ID format')
    }
    const updated = await this.pageRepository.update(id, {
      status: 'draft',
      publishedAt: null,
    })
    if (!updated) {
      throw new NotFoundError('Page', id)
    }
    return updated
  }

  /**
   * Resolve dynamic blocks in a page.
   *
   * Strategy:
   * 1. Collect ALL productIds from every product_carousel block with explicit productIds
   *    into a single array, then execute ONE ProductModel.find() call.
   * 2. For product_carousel blocks with a query field, execute per-block queries.
   * 3. For category_grid blocks, collect all categoryIds and execute ONE CategoryModel.find() call.
   * 4. All other block types pass through unchanged.
   */
  async resolveBlocks(blocks: IPageBlock[]): Promise<ResolvedBlock[]> {
    // ── Pass 1: collect all static productIds across all product_carousel blocks ──
    const allStaticProductIds: string[] = []
    for (const block of blocks) {
      if (block.type === 'product_carousel') {
        const data = block.data as { productIds?: string[]; query?: unknown }
        if (data.productIds && data.productIds.length > 0) {
          for (const pid of data.productIds) {
            if (!allStaticProductIds.includes(pid)) {
              allStaticProductIds.push(pid)
            }
          }
        }
      }
    }

    // ── Pass 2: collect all categoryIds across all category_grid blocks ──
    const allCategoryIds: string[] = []
    for (const block of blocks) {
      if (block.type === 'category_grid') {
        const data = block.data as { categoryIds?: string[] }
        if (data.categoryIds && data.categoryIds.length > 0) {
          for (const cid of data.categoryIds) {
            if (!allCategoryIds.includes(cid)) {
              allCategoryIds.push(cid)
            }
          }
        }
      }
    }

    // ── Single batch query for all static products ──
    const productMap = new Map<string, unknown>()
    if (allStaticProductIds.length > 0) {
      const objectIds = allStaticProductIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id))
      const products = await ProductModel.find({ _id: { $in: objectIds } }).lean()
      for (const product of products) {
        productMap.set(product._id.toString(), product)
      }
    }

    // ── Single batch query for all categories ──
    const categoryMap = new Map<string, unknown>()
    if (allCategoryIds.length > 0) {
      const objectIds = allCategoryIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id))
      const categories = await CategoryModel.find({ _id: { $in: objectIds } }).lean()
      for (const category of categories) {
        categoryMap.set(category._id.toString(), category)
      }
    }

    // ── Pass 3: resolve each block ──
    const resolved: ResolvedBlock[] = []

    for (const block of blocks) {
      if (block.type === 'product_carousel') {
        const data = block.data as {
          title?: string
          productIds?: string[]
          query?: { type: string; categoryId?: string; tag?: string; limit?: number }
        }

        if (data.productIds && data.productIds.length > 0) {
          // Static productIds — use pre-fetched map
          const resolvedProducts = data.productIds.map((id) => productMap.get(id)).filter(Boolean)

          resolved.push({
            ...block,
            resolvedProducts,
          } as ResolvedProductCarouselBlock)
        } else if (data.query) {
          // Dynamic query — execute per-block
          const q = data.query
          const limit = q.limit ?? 10
          let queryFilter: Record<string, unknown> = {}

          if (q.type === 'category' && q.categoryId && Types.ObjectId.isValid(q.categoryId)) {
            queryFilter = { category: new Types.ObjectId(q.categoryId) }
          } else if (q.type === 'tag' && q.tag) {
            queryFilter = { tags: q.tag }
          } else if (q.type === 'bestseller') {
            queryFilter = {}
          }

          const sortOption: Record<string, 1 | -1> =
            q.type === 'bestseller' ? { sold: -1 } : { createdAt: -1 }

          const queryProducts = await ProductModel.find(queryFilter)
            .sort(sortOption)
            .limit(limit)
            .lean()

          resolved.push({
            ...block,
            resolvedProducts: queryProducts,
          } as ResolvedProductCarouselBlock)
        } else {
          // No productIds and no query — pass through
          resolved.push(block)
        }
      } else if (block.type === 'category_grid') {
        const data = block.data as { categoryIds?: string[] }
        if (data.categoryIds && data.categoryIds.length > 0) {
          const resolvedCategories = data.categoryIds
            .map((id) => categoryMap.get(id))
            .filter(Boolean)

          resolved.push({
            ...block,
            resolvedCategories,
          } as ResolvedCategoryGridBlock)
        } else {
          resolved.push(block)
        }
      } else {
        // All other block types pass through unchanged
        resolved.push(block)
      }
    }

    return resolved
  }
}
