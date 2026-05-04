import mongoose, { ClientSession } from 'mongoose'
import { Logger } from './logger'

export interface TransactionOptions {
  /** Max retries on WriteConflict / TransientTransactionError (default 3) */
  maxRetries?: number
  readPreference?: string
}

const TRANSIENT_ERROR_LABELS = new Set([
  'TransientTransactionError',
  'UnknownTransactionCommitResult',
])

function isTransient(err: unknown): boolean {
  if (err && typeof err === 'object' && 'errorLabels' in err) {
    const labels = (err as any).errorLabels as string[]
    return labels.some((l) => TRANSIENT_ERROR_LABELS.has(l))
  }
  // WriteConflict code 112
  if (err && typeof err === 'object' && 'code' in err) {
    return (err as any).code === 112
  }
  return false
}

/**
 * Run `fn` inside a Mongoose session + transaction.
 * - Automatically retries up to `options.maxRetries` times on transient errors
 *   (TransientTransactionError, UnknownTransactionCommitResult, WriteConflict code 112).
 * - Aborts and re-throws on non-transient errors.
 * - Closes the session in all cases (commit, abort, or error).
 * - Logs transaction start/commit/abort and retry counter (order.create.retry) for observability.
 *
 * Usage:
 *   const order = await withTransaction(async (session) => {
 *     const order = await orderRepository.create(data, { session })
 *     await snapshotRepository.createMany(snapshots, { session })
 *     return order
 *   })
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const { maxRetries = 3 } = options

  const session = await mongoose.startSession()

  let attempt = 0
  try {
    while (true) {
      attempt++
      session.startTransaction({
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true },
      })

      try {
        const result = await fn(session)
        await session.commitTransaction()

        if (attempt > 1) {
          // Metric: order.create.retry — counts how many retries were needed before commit.
          Logger.dbInfo('[Transaction] order.create.retry committed after retry', {
            attempt,
            metric: 'order.create.retry',
          })
        }

        return result
      } catch (err) {
        await session.abortTransaction()

        Logger.dbWarn('[Transaction] Transaction aborted', {
          attempt,
          error: err instanceof Error ? err.message : String(err),
        })

        if (isTransient(err) && attempt < maxRetries) {
          // Metric: order.create.retry — spike in this log indicates lock contention.
          Logger.dbWarn('[Transaction] Transient error — retrying', {
            attempt,
            maxRetries,
            metric: 'order.create.retry',
            error: err instanceof Error ? err.message : String(err),
          })
          continue
        }

        throw err
      }
    }
  } finally {
    await session.endSession()
  }
}
