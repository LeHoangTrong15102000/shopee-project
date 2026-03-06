import { Types } from 'mongoose'
import { IProduct, ISKU } from '../@types/models.type'
import {
  IProductRepository,
  ProductFilterOptions,
  ProductSortOptions,
  CreateProductDTO,
  UpdateProductDTO,
} from '@repositories/interfaces/product.repository.interface'
import { ISKURepository, CreateSKUDTO } from '@repositories/interfaces/sku.repository.interface'
import { PaginatedResult, PaginationOptions } from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError } from './base.service'
import { HOST } from '@utils/helper'
import { FOLDERS, FOLDER_UPLOAD, ROUTE_IMAGE } from '@constants/config'
import { cacheService, CacheKeys, CacheTTL } from '@utils/cache.service'
import fs from 'fs'

export interface CreateProductWithSKUsInput extends CreateProductDTO {
  variants?: Array<{ type: string; name: string; options: string[] }>
  skus?: Array<{ value: string; price: number; stock: number; image?: string; variant_values?: Record<string, string> }>
}

export interface UpdateProductWithSKUsInput extends UpdateProductDTO {
  variants?: Array<{ type: string; name: string; options: string[] }>
  skus?: Array<{ value: string; price: number; stock: number; image?: string; variant_values?: Record<string, string> }>
}

export class ProductService extends BaseService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly skuRepository?: ISKURepository
  ) {
    super()
  }

  /**
   * Transform product image URLs to full paths
   */
  handleImageProduct<T extends { image?: string; images?: string[] }>(product: T): T {
    if (product.image !== undefined && product.image !== '') {
      product.image = HOST + `/${ROUTE_IMAGE}/` + product.image
    }
    if (product.images !== undefined && product.images.length !== 0) {
      product.images = product.images.map((image: string) =>
        image !== '' ? HOST + `/${ROUTE_IMAGE}/` + image : ''
      )
    }
    return product
  }

  private removeImageProduct(image: string | undefined): void {
    if (image !== undefined && image !== '') {
      fs.unlink(`${FOLDER_UPLOAD}/${FOLDERS.PRODUCT}/${image}`, (err) => {
        if (err) console.error(err)
      })
    }
  }

  private removeManyImageProduct(images: string[] | undefined): void {
    if (images !== undefined && images.length > 0) {
      images.forEach((image) => this.removeImageProduct(image))
    }
  }

  async createProduct(data: CreateProductWithSKUsInput): Promise<IProduct & { skus?: ISKU[] }> {
    const { skus: skuData, ...productData } = data
    const product = await this.productRepository.create(productData)
    cacheService.del(CacheKeys.productsPattern())

    let skus: ISKU[] | undefined
    if (skuData && skuData.length > 0 && this.skuRepository) {
      skus = []
      for (const sku of skuData) {
        const created = await this.skuRepository.create({
          value: sku.value,
          price: sku.price,
          stock: sku.stock,
          image: sku.image,
          product: product._id!,
          variant_values: sku.variant_values,
        })
        skus.push(created)
      }
    }

    const result = this.handleImageProduct(product)
    return skus ? { ...result, skus } : result
  }

  async getProducts(
    filters: ProductFilterOptions,
    sort: ProductSortOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IProduct>> {
    const normalizedPagination = this.normalizePagination(pagination)
    const cacheKey = CacheKeys.productsList({
      page: String(normalizedPagination.page),
      limit: String(normalizedPagination.limit),
      category: String(filters.category || ''),
      sort_by: String(sort.sort_by || ''),
      order: String(sort.order || ''),
      rating_filter: String(filters.rating_filter || ''),
      price_min: String(filters.price_min || ''),
      price_max: String(filters.price_max || ''),
      name: String(filters.name || ''),
    })

    if (!filters.exclude) {
      const cached = cacheService.get<PaginatedResult<IProduct>>(cacheKey)
      if (cached) return cached
    }

    const result = await this.productRepository.findProducts(filters, sort, normalizedPagination)
    result.data = result.data.map((p: IProduct) => this.handleImageProduct(p))

    if (!filters.exclude) {
      cacheService.set(cacheKey, result, CacheTTL.PRODUCTS_LIST)
    }
    return result
  }

  async getAllProducts(categoryId?: string): Promise<IProduct[]> {
    const filter = categoryId ? { category: this.toObjectId(categoryId) } : {}
    const products = await this.productRepository.find(filter)
    return products.map((p: IProduct) => this.handleImageProduct(p))
  }

  async getProductById(productId: string): Promise<IProduct & { skus?: ISKU[] }> {
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }

    const cacheKey = CacheKeys.productDetail(productId)
    const cached = cacheService.get<IProduct & { skus?: ISKU[] }>(cacheKey)
    if (cached) return cached

    await this.productRepository.incrementView(productId)
    const product = await this.productRepository.findById(productId)
    if (!product) {
      throw new NotFoundError('Product', productId)
    }

    const result: IProduct & { skus?: ISKU[] } = this.handleImageProduct(product)

    // Attach SKUs if repository available
    if (this.skuRepository) {
      result.skus = await this.skuRepository.findByProduct(productId)
    }

    cacheService.set(cacheKey, result, CacheTTL.PRODUCT_DETAIL)
    return result
  }

  async updateProduct(productId: string, data: UpdateProductWithSKUsInput): Promise<IProduct & { skus?: ISKU[] }> {
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }

    const { skus: skuData, ...productData } = data
    const product = await this.productRepository.updateById(productId, productData)
    if (!product) {
      throw new NotFoundError('Product', productId)
    }

    let skus: ISKU[] | undefined
    // Handle SKU upsert if provided
    if (skuData && this.skuRepository) {
      const existingSkus = await this.skuRepository.findByProduct(productId)
      const existingByValue = new Map(existingSkus.map((s) => [s.value, s]))
      const incomingValues = new Set(skuData.map((s) => s.value))

      skus = []
      for (const sku of skuData) {
        const existing = existingByValue.get(sku.value)
        if (existing) {
          // Update existing SKU
          const updated = await this.skuRepository.updateById(existing._id!.toString(), {
            price: sku.price,
            stock: sku.stock,
            image: sku.image,
            variant_values: sku.variant_values,
          })
          if (updated) skus.push(updated)
        } else {
          // Create new SKU
          const created = await this.skuRepository.create({
            value: sku.value,
            price: sku.price,
            stock: sku.stock,
            image: sku.image,
            product: product._id!,
            variant_values: sku.variant_values,
          })
          skus.push(created)
        }
      }

      // Soft-delete removed SKUs (set stock to 0)
      for (const [value, existing] of existingByValue) {
        if (!incomingValues.has(value)) {
          await this.skuRepository.updateById(existing._id!.toString(), { stock: 0 })
        }
      }
    }

    cacheService.del(CacheKeys.productDetail(productId))
    cacheService.del(CacheKeys.productsPattern())
    const result = this.handleImageProduct(product)
    return skus ? { ...result, skus } : result
  }

  async deleteProduct(productId: string): Promise<void> {
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }

    const product = await this.productRepository.deleteById(productId)
    if (!product) {
      throw new NotFoundError('Product', productId)
    }

    // Delete associated SKUs
    if (this.skuRepository) {
      await this.skuRepository.deleteMany({ product: new Types.ObjectId(productId) })
    }

    this.removeImageProduct(product.image)
    this.removeManyImageProduct(product.images)
    cacheService.del(CacheKeys.productDetail(productId))
    cacheService.del(CacheKeys.productsPattern())
  }

  async deleteManyProducts(productIds: string[]): Promise<number> {
    const objectIds = productIds.map((id) => this.toObjectId(id))
    const products = await this.productRepository.find({ _id: { $in: objectIds } })

    const deletedCount = await this.productRepository.deleteMany({ _id: { $in: objectIds } })

    // Delete associated SKUs
    if (this.skuRepository) {
      await this.skuRepository.deleteMany({ product: { $in: objectIds } })
    }

    products.forEach((product: IProduct) => {
      this.removeImageProduct(product.image)
      this.removeManyImageProduct(product.images)
      cacheService.del(CacheKeys.productDetail(product._id!.toString()))
    })
    cacheService.del(CacheKeys.productsPattern())

    return deletedCount
  }

  async searchProducts(query: string, pagination: PaginationOptions): Promise<PaginatedResult<IProduct>> {
    const result = await this.productRepository.searchByName(query, this.normalizePagination(pagination))
    result.data = result.data.map((p: IProduct) => this.handleImageProduct(p))
    return result
  }

  async findLowStockProducts(threshold: number): Promise<IProduct[]> {
    return this.productRepository.findLowStock(threshold)
  }

  // ─── Admin Inventory Methods ────────────────────────────────────

  async getLowStockProducts(threshold: number, pagination: PaginationOptions) {
    return (this.productRepository as any).findLowStockPaginated(threshold, this.normalizePagination(pagination))
  }

  async getOutOfStockProducts(pagination: PaginationOptions) {
    return (this.productRepository as any).findOutOfStock(this.normalizePagination(pagination))
  }

  async updateStock(productId: string, quantity: number) {
    if (!this.isValidObjectId(productId)) throw new ValidationError('Invalid product ID')
    const product = await this.productRepository.findById(productId)
    if (!product) throw new NotFoundError('Product', productId)
    return this.productRepository.updateById(productId, { quantity })
  }

  async bulkUpdateStock(items: Array<{ product_id: string; quantity: number }>) {
    const results = { updated: 0, failed: 0, errors: [] as Array<{ product_id: string; reason: string }> }

    for (const item of items) {
      try {
        if (!this.isValidObjectId(item.product_id)) {
          results.failed++
          results.errors.push({ product_id: item.product_id, reason: 'Invalid product ID' })
          continue
        }
        const product = await this.productRepository.findById(item.product_id)
        if (!product) {
          results.failed++
          results.errors.push({ product_id: item.product_id, reason: 'Product not found' })
          continue
        }
        await this.productRepository.updateById(item.product_id, { quantity: item.quantity })
        results.updated++
      } catch {
        results.failed++
        results.errors.push({ product_id: item.product_id, reason: 'Update failed' })
      }
    }

    return results
  }
}

