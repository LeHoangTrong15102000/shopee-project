/**
 * MeilisearchService — wraps the Meilisearch JS client and exposes typed methods
 * for product index management and search operations.
 *
 * Index: `products`
 * Searchable: name, description, category_name, tags
 * Filterable: category_id, price, rating, stock_status, shop_id
 * Sortable: price, rating, sold_count, createdAt
 */
import { MeiliSearch, Index, SearchResponse } from 'meilisearch'
import { Logger } from '@utils/logger'

export interface ProductDocument {
  id: string
  name: string
  description?: string
  category_id: string
  category_name: string
  price: number
  rating: number
  sold_count: number
  stock: number
  stock_status: 'in_stock' | 'out_of_stock'
  image?: string
  images?: string[]
  shop_id?: string
  tags?: string[]
  createdAt?: string
}

export interface SearchProductsOptions {
  q?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  sort?: string
  page?: number
  limit?: number
}

export interface SearchProductsResult {
  hits: ProductDocument[]
  totalHits: number
  facets: Record<string, Record<string, number>>
  processingTimeMs: number
  page: number
  limit: number
}

const INDEX_NAME = 'products'

export class MeilisearchService {
  private readonly client: MeiliSearch
  private readonly indexName = INDEX_NAME

  constructor(host?: string, apiKey?: string) {
    this.client = new MeiliSearch({
      host: host ?? process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
      apiKey: apiKey ?? process.env.MEILISEARCH_MASTER_KEY,
    })
  }

  /**
   * Configure the products index with searchable, filterable, and sortable attributes.
   * Idempotent — safe to call on every startup.
   */
  async configureIndex(): Promise<void> {
    try {
      const index = this.client.index(this.indexName)

      await index.updateSearchableAttributes(['name', 'description', 'category_name', 'tags'])

      await index.updateFilterableAttributes([
        'category_id',
        'price',
        'rating',
        'stock_status',
        'shop_id',
      ])

      await index.updateSortableAttributes(['price', 'rating', 'sold_count', 'createdAt'])

      Logger.apiInfo('[MeilisearchService] Index configured successfully', {
        index: this.indexName,
      })
    } catch (err: unknown) {
      Logger.apiError('[MeilisearchService] Failed to configure index', {
        message: err instanceof Error ? err.message : String(err),
      })
      // Non-fatal: log and continue — search will still work with defaults
    }
  }

  /**
   * Upsert a product document into the Meilisearch index.
   */
  async upsertProduct(doc: ProductDocument): Promise<void> {
    try {
      const index = this.client.index(this.indexName)
      await index.addDocuments([doc], { primaryKey: 'id' })
      Logger.apiInfo('[MeilisearchService] Product upserted', { id: doc.id })
    } catch (err: unknown) {
      Logger.apiError('[MeilisearchService] Failed to upsert product', {
        id: doc.id,
        message: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  /**
   * Delete a product document from the Meilisearch index.
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      const index = this.client.index(this.indexName)
      await index.deleteDocument(productId)
      Logger.apiInfo('[MeilisearchService] Product deleted', { id: productId })
    } catch (err: unknown) {
      Logger.apiError('[MeilisearchService] Failed to delete product', {
        id: productId,
        message: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  /**
   * Search products with filters, sorting, and facets.
   */
  async search(options: SearchProductsOptions): Promise<SearchProductsResult> {
    const { q = '', category, minPrice, maxPrice, rating, sort, page = 1, limit = 20 } = options

    const filters = this.buildFilterString({ category, minPrice, maxPrice, rating })
    const sortArray = this.buildSortArray(sort)
    const offset = (page - 1) * limit

    const index = this.client.index(this.indexName)
    const result: SearchResponse<ProductDocument> = await index.search(q, {
      filter: filters || undefined,
      sort: sortArray.length > 0 ? sortArray : undefined,
      offset,
      limit,
      facets: ['category_id'],
    })

    return {
      hits: result.hits,
      totalHits: result.estimatedTotalHits ?? result.hits.length,
      facets: (result.facetDistribution as Record<string, Record<string, number>>) ?? {},
      processingTimeMs: result.processingTimeMs,
      page,
      limit,
    }
  }

  /**
   * Autocomplete suggestions using Meilisearch prefix search.
   * Returns up to `limit` product name suggestions for the given prefix.
   */
  async suggest(prefix: string, limit = 8): Promise<string[]> {
    if (!prefix || prefix.trim().length === 0) return []

    const index = this.client.index(this.indexName)
    const result: SearchResponse<ProductDocument> = await index.search(prefix.trim(), {
      limit,
      attributesToRetrieve: ['name'],
    })

    // Deduplicate by name
    const seen = new Set<string>()
    const suggestions: string[] = []
    for (const hit of result.hits) {
      const name = hit.name.toLowerCase()
      if (!seen.has(name)) {
        seen.add(name)
        suggestions.push(hit.name)
      }
    }
    return suggestions
  }

  /**
   * Reindex all products by upserting an array of documents.
   * Called by the admin reindex job.
   */
  async reindexAll(docs: ProductDocument[]): Promise<void> {
    if (docs.length === 0) return
    const index = this.client.index(this.indexName)
    // Meilisearch accepts up to 1000 documents per batch
    const BATCH_SIZE = 500
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE)
      await index.addDocuments(batch, { primaryKey: 'id' })
    }
    Logger.apiInfo('[MeilisearchService] Reindex complete', { count: docs.length })
  }

  /**
   * Build a Meilisearch filter string from search options.
   */
  buildFilterString(opts: {
    category?: string
    minPrice?: number
    maxPrice?: number
    rating?: number
  }): string {
    const parts: string[] = []

    if (opts.category) {
      parts.push(`category_id = "${opts.category}"`)
    }

    if (opts.minPrice !== undefined && opts.maxPrice !== undefined) {
      parts.push(`price >= ${opts.minPrice} AND price <= ${opts.maxPrice}`)
    } else if (opts.minPrice !== undefined) {
      parts.push(`price >= ${opts.minPrice}`)
    } else if (opts.maxPrice !== undefined) {
      parts.push(`price <= ${opts.maxPrice}`)
    }

    if (opts.rating !== undefined) {
      parts.push(`rating >= ${opts.rating}`)
    }

    return parts.join(' AND ')
  }

  /**
   * Build a Meilisearch sort array from a sort param string.
   * Supported values: price:asc, price:desc, rating:desc, sold_count:desc, createdAt:desc
   */
  buildSortArray(sort?: string): string[] {
    if (!sort) return []

    const sortMap: Record<string, string> = {
      'price:asc': 'price:asc',
      'price:desc': 'price:desc',
      'rating:desc': 'rating:desc',
      'sold_count:desc': 'sold_count:desc',
      'createdAt:desc': 'createdAt:desc',
      'createdAt:asc': 'createdAt:asc',
    }

    const mapped = sortMap[sort]
    return mapped ? [mapped] : []
  }

  /** Expose the underlying client for advanced use (e.g. health checks). */
  getClient(): MeiliSearch {
    return this.client
  }
}
