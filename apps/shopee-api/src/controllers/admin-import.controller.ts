import { Request, Response } from 'express'
import multer, { MulterError } from 'multer'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { Logger } from '@utils/logger'
import { ImportService } from '@services/import.service'
import { withAuditLog } from '@utils/audit-log.wrapper'

// ---------------------------------------------------------------------------
// Multer configuration — memory storage, JSON/CSV only, max 10 MB
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = new Set([
  'application/json',
  'text/csv',
  'text/plain', // some clients send CSV as text/plain
  'application/vnd.ms-excel', // older Excel CSV MIME
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase()
    if (ALLOWED_MIME_TYPES.has(file.mimetype) || ext === 'json' || ext === 'csv') {
      cb(null, true)
    } else {
      cb(
        new ErrorHandler(
          STATUS.BAD_REQUEST,
          'Only JSON and CSV files are supported',
        ) as unknown as null,
        false,
      )
    }
  },
})

// ---------------------------------------------------------------------------
// Singleton service instance (injected via container pattern)
// ---------------------------------------------------------------------------

const importService = new ImportService()

// ---------------------------------------------------------------------------
// CSV parser — simple line-based, no external dependency needed
// ---------------------------------------------------------------------------

function parseCsv(content: string): Record<string, unknown>[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows: Record<string, unknown>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, unknown> = {}
    headers.forEach((header, idx) => {
      const raw = values[idx] ?? ''
      // Attempt numeric coercion for known numeric fields
      const numericFields = new Set([
        'price',
        'rating',
        'price_before_discount',
        'quantity',
        'sold',
        'view',
      ])
      if (numericFields.has(header) && raw !== '') {
        const num = Number(raw)
        row[header] = isNaN(num) ? raw : num
      } else {
        row[header] = raw
      }
    })
    rows.push(row)
  }

  return rows
}

// ---------------------------------------------------------------------------
// Multer error handler helper
// ---------------------------------------------------------------------------

function handleMulterError(err: unknown): never {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'File size exceeds 10MB limit')
    }
    throw new ErrorHandler(STATUS.BAD_REQUEST, err.message)
  }
  throw err
}

// ---------------------------------------------------------------------------
// Core import handler (used by withAuditLog HOF)
// ---------------------------------------------------------------------------

const _importProductsHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw new ErrorHandler(
      STATUS.BAD_REQUEST,
      'No file uploaded. Send a JSON or CSV file in the "file" field.',
    )
  }

  const dryRun = req.query.dryRun === 'true'
  const fileContent = req.file.buffer.toString('utf8')
  const ext = req.file.originalname.split('.').pop()?.toLowerCase()

  let rawRows: unknown[]
  try {
    if (ext === 'csv' || req.file.mimetype === 'text/csv') {
      rawRows = parseCsv(fileContent)
    } else {
      const parsed = JSON.parse(fileContent)
      rawRows = Array.isArray(parsed) ? parsed : [parsed]
    }
  } catch {
    throw new ErrorHandler(
      STATUS.BAD_REQUEST,
      'Failed to parse file. Ensure it is valid JSON or CSV.',
    )
  }

  Logger.apiInfo('import.products.start', {
    dryRun,
    rowCount: rawRows.length,
    fileName: req.file.originalname,
  })

  const result = await importService.importProducts(rawRows, { dryRun })

  if (dryRun) {
    responseSuccess(res, {
      message: 'Dry run complete. No data was written.',
      data: result,
    })
  } else {
    responseSuccess(res, {
      message: 'Import completed',
      data: result,
    })
  }
}

// ---------------------------------------------------------------------------
// POST /admin/import/products
// Wrapped with multer (handles file upload) then audit log HOF (non-dry-run)
// ---------------------------------------------------------------------------

export const importProducts = (req: Request, res: Response): void => {
  // Run multer first, then the actual handler
  upload.single('file')(req, res, async (err) => {
    if (err) {
      try {
        handleMulterError(err)
      } catch (handledErr) {
        // Let the global error handler deal with it via next — but since we're
        // inside a multer callback we need to throw manually. Re-throw so
        // asyncHandler / global handler can catch it.
        const { asyncHandler } = await import('@utils/async-handler')
        // Wrap in a fake next call — simplest approach: just throw and let
        // Express catch it via the domain or unhandledRejection. Instead,
        // respond directly for multer errors since we're outside asyncHandler.
        if (handledErr instanceof ErrorHandler) {
          res.status(handledErr.status).json({ message: handledErr.error })
        } else {
          res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' })
        }
        return
      }
    }

    const dryRun = req.query.dryRun === 'true'

    try {
      if (dryRun) {
        // Dry run — no audit log needed
        await _importProductsHandler(req, res)
      } else {
        // Real import — wrap with audit log
        const auditWrapped = withAuditLog(_importProductsHandler, {
          action: 'product.import',
          resource: 'product',
          getAfterSnapshot: async () => {
            const stats = await importService.getImportStats()
            return stats as unknown as Record<string, unknown>
          },
        })
        await auditWrapped(req, res)
      }
    } catch (handlerErr) {
      if (handlerErr instanceof ErrorHandler) {
        res.status(handlerErr.status).json({ message: handlerErr.error })
      } else {
        Logger.apiError('import.products.unhandled', {
          error: (handlerErr as Error)?.message,
        })
        res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' })
      }
    }
  })
}

// ---------------------------------------------------------------------------
// GET /admin/import/products/stats
// ---------------------------------------------------------------------------

export const getImportStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await importService.getImportStats()
  responseSuccess(res, {
    message: 'Import stats retrieved successfully',
    data: stats,
  })
}

const adminImportController = {
  importProducts,
  getImportStats,
}

export default adminImportController
