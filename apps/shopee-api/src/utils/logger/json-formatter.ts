import { ILogFormatter, LogLevel, LogMeta } from './types'

/**
 * Sensitive field names (and substrings) that must be redacted from log output.
 * Matching is case-insensitive and checks whether the key *contains* the pattern.
 */
const SENSITIVE_PATTERNS = [
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'creditcard',
  'credit_card',
  'cvv',
  'ssn',
  'authorization',
  'cookie',
]

/**
 * Recursively redact sensitive fields from an object.
 * Replaces matched values with "[REDACTED]".
 */
function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ?? '',
    }
  }
  if (Array.isArray(value)) return value.map(redact)
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const lower = k.toLowerCase()
      if (SENSITIVE_PATTERNS.some((p) => lower.includes(p))) {
        result[k] = '[REDACTED]'
      } else {
        result[k] = redact(v)
      }
    }
    return result
  }
  return value
}

/**
 * JSON log formatter.
 *
 * Produces a single-line JSON string per log entry:
 *   { "timestamp": "...", "level": "info", "category": "API", "message": "...", ...meta }
 *
 * - Timestamps are ISO 8601.
 * - Error objects are serialized with name, message, and stack.
 * - Sensitive fields are redacted.
 */
export class JsonFormatter implements ILogFormatter {
  format(level: LogLevel, category: string, message: string, meta?: LogMeta): string {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
    }

    if (meta && Object.keys(meta).length > 0) {
      const sanitized = redact(meta) as Record<string, unknown>
      Object.assign(entry, sanitized)
    }

    try {
      return JSON.stringify(entry)
    } catch {
      // Fallback for non-serializable values
      return JSON.stringify({
        timestamp: entry.timestamp,
        level,
        category,
        message,
        meta: '[non-serializable]',
      })
    }
  }
}
