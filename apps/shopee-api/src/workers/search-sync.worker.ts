/**
 * SearchSyncWorker — processes jobs from the `search-sync` queue.
 *
 * Handles product.created, product.updated, and product.deleted events
 * by syncing the Meilisearch products index.
 */
import { Worker, Job } from 'bullmq'
import { Logger } from '@utils/logger'
import { SEARCH_SYNC_QUEUE } from '../queues/queue.config'
import { SearchSyncJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'
import { MeilisearchService, ProductDocument } from '@services/meilisearch.service'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import { IProduct } from '../@types/models.type'
import { Types } from 'mongoose'

/**
 * Build a denormalized ProductDocument from a MongoDB product ID.
 * Resolves the category ObjectId to a category_name string.
 * Returns null if the product is not found.
 */
async function buildProductDocument(productId: string): Promise<ProductDocument | null> {
  const product = await ProductModel.findById(productId).lean<IProduct>()
  if (!product) {
    Logger.apiWarn('[SearchSyncWorker] Product not found for indexing', { productId })
    return null
  }

  // Resolve category name
  let category_name = ''
  let category_id = ''
  if (product.category) {
    const catId =
      product.category instanceof Types.ObjectId
        ? product.category
        : new Types.ObjectId(String(product.category))
    category_id = catId.toString()
    const category = await CategoryModel.findById(catId).lean()
    if (category) {
      category_name = (category as { name?: string }).name ?? ''
    }
  }

  const stock = product.quantity ?? 0
  const stock_status: 'in_stock' | 'out_of_stock' = stock > 0 ? 'in_stock' : 'out_of_stock'

  const doc: ProductDocument = {
    id: product._id!.toString(),
    name: product.name,
    description: product.description ?? undefined,
    category_id,
    category_name,
    price: product.price ?? 0,
    rating: product.rating ?? 0,
    sold_count: product.sold ?? 0,
    stock,
    stock_status,
    image: product.image,
    images: product.images,
    shop_id: undefined,
    createdAt: product.createdAt?.toISOString(),
  }

  return doc
}

export class SearchSyncWorker {
  readonly worker: Worker

  constructor(private readonly meilisearchService: MeilisearchService) {
    this.worker = new Worker<SearchSyncJobPayload>(
      SEARCH_SYNC_QUEUE,
      async (job: Job<SearchSyncJobPayload>) => {
        const { entityType, entityId, operation } = job.data

        Logger.apiInfo('[SearchSyncWorker] Processing search-sync job', {
          jobId: job.id,
          entityType,
          entityId,
          operation,
        })

        if (entityType !== 'product') {
          Logger.apiWarn('[SearchSyncWorker] Unknown entityType — skipping', { entityType })
          return
        }

        // Full reindex: page through all products and upsert each
        if (entityId === 'all' && operation === 'index') {
          await this.handleReindexAll()
          return
        }

        if (operation === 'delete') {
          await this.meilisearchService.deleteProduct(entityId)
          Logger.apiInfo('[SearchSyncWorker] Product deleted from index', { entityId })
          return
        }

        // operation === 'index' (created or updated)
        const doc = await buildProductDocument(entityId)
        if (!doc) {
          Logger.apiWarn('[SearchSyncWorker] Skipping index — product not found', { entityId })
          return
        }

        await this.meilisearchService.upsertProduct(doc)
        Logger.apiInfo('[SearchSyncWorker] Product indexed', { entityId })
      },
      { connection: getWorkerConnection() },
    )

    this.worker.on('error', (err) => {
      Logger.apiError('[SearchSyncWorker] Worker error', { message: err.message })
    })

    this.worker.on('failed', (job, err) => {
      Logger.apiError('[SearchSyncWorker] Job failed', {
        jobId: job?.id,
        error: err.message,
      })
    })
  }

  /**
   * Reindex all products from MongoDB into Meilisearch.
   * Pages through all products in batches of 500.
   */
  private async handleReindexAll(): Promise<void> {
    Logger.apiInfo('[SearchSyncWorker] Starting full reindex')

    const BATCH_SIZE = 500
    let skip = 0
    let totalIndexed = 0

    while (true) {
      const products = await ProductModel.find({}).skip(skip).limit(BATCH_SIZE).lean()
      if (products.length === 0) break

      const docs = await Promise.all(products.map((p) => buildProductDocument(p._id.toString())))
      const validDocs = docs.filter((d): d is NonNullable<typeof d> => d !== null)

      if (validDocs.length > 0) {
        await this.meilisearchService.reindexAll(validDocs)
        totalIndexed += validDocs.length
      }

      skip += BATCH_SIZE
      if (products.length < BATCH_SIZE) break
    }

    Logger.apiInfo('[SearchSyncWorker] Full reindex complete', { totalIndexed })
  }
}
