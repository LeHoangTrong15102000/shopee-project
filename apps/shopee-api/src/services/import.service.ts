import { Types } from 'mongoose'
import { z } from 'zod'
import { ProductModel } from '@database/models/product.model'
import { Logger } from '@utils/logger'
import { ValidationError } from './base.service'

// ---------------------------------------------------------------------------
// Zod schema for a single product row in the import file
// ---------------------------------------------------------------------------

export const ProductImportRowSchema = z.object({
  _id: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().min(1, 'name is required'),
  image: z.string().min(1, 'image is required'),
  images: z.array(z.string()).default([]),
  description: z.string().optional(),
  category: z.string().min(1, 'category is required'),
  price: z.number().nonnegative(),
  rating: z.number().min(0).max(5).default(0),
  price_before_discount: z.number().nonnegative().default(0),
  quantity: z.number().int().nonnegative().default(0),
  sold: z.number().int().nonnegative().default(0),
  view: z.number().int().nonnegative().default(0),
  location: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type ProductImportRow = z.infer<typeof ProductImportRowSchema>

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ImportValidationError {
  index: number
  row: unknown
  errors: string[]
}

export interface DryRunResult {
  toCreate: number
  toUpdate: number
  toSkip: number
  errors: ImportValidationError[]
  sample: ProductImportRow[]
}

export interface ImportResult {
  created: number
  updated: number
  failed: number
  errors: ImportValidationError[]
}

export interface ImportStats {
  totalProducts: number
  productsWithLocation: number
  locationStats: Array<{ _id: string; count: number }>
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class ImportService {
  /**
   * Validate and parse raw rows from the uploaded file.
   * Returns validated rows and any per-row validation errors.
   */
  private validateRows(rawRows: unknown[]): {
    valid: ProductImportRow[]
    errors: ImportValidationError[]
  } {
    const valid: ProductImportRow[] = []
    const errors: ImportValidationError[] = []

    for (let i = 0; i < rawRows.length; i++) {
      const result = ProductImportRowSchema.safeParse(rawRows[i])
      if (result.success) {
        valid.push(result.data)
      } else {
        errors.push({
          index: i,
          row: rawRows[i],
          errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
        })
      }
    }

    return { valid, errors }
  }

  /**
   * Transform a validated import row into a MongoDB-ready document.
   * Handles the MongoDB Extended JSON format (_id.$oid, category.$oid, etc.)
   * that may come from a mongodump-style export.
   */
  private transformRow(row: ProductImportRow): Record<string, unknown> {
    const doc: Record<string, unknown> = {
      name: row.name,
      image: row.image,
      images: row.images,
      description: row.description,
      price: row.price,
      rating: row.rating,
      price_before_discount: row.price_before_discount,
      quantity: row.quantity,
      sold: row.sold,
      view: row.view,
      location: row.location,
    }

    // Handle category — may be a plain string ObjectId or an object with $oid
    const rawCategory = row.category as unknown
    if (rawCategory && typeof rawCategory === 'object' && '$oid' in (rawCategory as object)) {
      doc.category = new Types.ObjectId((rawCategory as { $oid: string }).$oid)
    } else if (typeof rawCategory === 'string' && Types.ObjectId.isValid(rawCategory)) {
      doc.category = new Types.ObjectId(rawCategory)
    } else {
      doc.category = rawCategory
    }

    // Handle _id — may be a plain string ObjectId or an object with $oid
    if (row._id) {
      const rawId = row._id as unknown
      if (rawId && typeof rawId === 'object' && '$oid' in (rawId as object)) {
        doc._id = new Types.ObjectId((rawId as { $oid: string }).$oid)
      } else if (typeof rawId === 'string' && Types.ObjectId.isValid(rawId)) {
        doc._id = new Types.ObjectId(rawId)
      }
    }

    if (row.createdAt) doc.createdAt = new Date(row.createdAt)
    if (row.updatedAt) doc.updatedAt = new Date(row.updatedAt)

    return doc
  }

  /**
   * Dry-run: validate and classify rows without writing to DB.
   */
  async dryRun(rawRows: unknown[]): Promise<DryRunResult> {
    const { valid, errors } = this.validateRows(rawRows)

    let toCreate = 0
    let toUpdate = 0
    let toSkip = 0

    for (const row of valid) {
      let existing = null

      // Match by _id first, then sku
      if (row._id && Types.ObjectId.isValid(row._id)) {
        existing = await ProductModel.exists({ _id: new Types.ObjectId(row._id) })
      }
      if (!existing && row.sku) {
        existing = await ProductModel.exists({ sku: row.sku })
      }

      if (existing) {
        toUpdate++
      } else {
        toCreate++
      }
    }

    toSkip = errors.length

    return {
      toCreate,
      toUpdate,
      toSkip,
      errors,
      sample: valid.slice(0, 10),
    }
  }

  /**
   * Perform the actual import using bulkWrite upsert.
   * NEVER calls deleteMany — only upserts.
   */
  async importProducts(
    rawRows: unknown[],
    options: { dryRun: boolean },
  ): Promise<DryRunResult | ImportResult> {
    if (options.dryRun) {
      return this.dryRun(rawRows)
    }

    const { valid, errors } = this.validateRows(rawRows)

    if (valid.length === 0 && errors.length > 0) {
      throw new ValidationError('All rows failed validation. No products imported.')
    }

    let created = 0
    let updated = 0
    let failed = 0
    const failedErrors: ImportValidationError[] = [...errors]

    if (valid.length === 0) {
      return { created, updated, failed, errors: failedErrors }
    }

    // Build bulkWrite operations — upsert by _id or sku
    const bulkOps = valid.map((row, idx) => {
      const doc = this.transformRow(row)
      const { _id, ...setFields } = doc

      // Build filter: prefer _id match, fall back to sku
      let filter: Record<string, unknown>
      if (_id) {
        filter = { _id }
      } else if (row.sku) {
        filter = { sku: row.sku }
      } else {
        // No stable identifier — use name as last resort (may create duplicates)
        filter = { name: row.name }
      }

      return {
        updateOne: {
          filter,
          update: { $set: setFields },
          upsert: true,
        },
      }
    })

    try {
      const result = await ProductModel.bulkWrite(
        bulkOps as Parameters<typeof ProductModel.bulkWrite>[0],
      )
      created = result.upsertedCount
      updated = result.modifiedCount
      failed = valid.length - created - updated

      Logger.apiInfo('import.products.complete', {
        created,
        updated,
        failed,
        validationErrors: errors.length,
      })
    } catch (err) {
      Logger.apiError('import.products.bulkWrite.failed', {
        error: (err as Error)?.message,
      })
      throw err
    }

    return { created, updated, failed, errors: failedErrors }
  }

  /**
   * Return product statistics for the stats endpoint.
   */
  async getImportStats(): Promise<ImportStats> {
    const [totalProducts, productsWithLocation, locationStats] = await Promise.all([
      ProductModel.countDocuments({}),
      ProductModel.countDocuments({ location: { $exists: true, $ne: null } }),
      ProductModel.aggregate<{ _id: string; count: number }>([
        { $match: { location: { $exists: true, $ne: null } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ])

    return { totalProducts, productsWithLocation, locationStats }
  }
}
