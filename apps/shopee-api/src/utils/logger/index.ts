/**
 * Logger — structured logging with formatter strategy and log-level filtering.
 *
 * Configuration (environment variables):
 *   LOG_FORMAT  — "json" | "pretty"  (default: "pretty" in dev, "json" in production)
 *   LOG_LEVEL   — "error" | "warn" | "info" | "debug"  (default: "debug" in dev, "info" in production)
 *
 * Backward compatibility:
 *   All existing static methods (Logger.apiInfo, Logger.chatbotError, etc.) are preserved.
 *   The PerformanceTracker class is re-exported unchanged.
 *
 * New capabilities:
 *   Logger.child({ requestId }) — creates a child logger that merges default meta.
 *   createLogger(defaultMeta)   — factory alias for Logger.child().
 */

import { ILogger, ILogFormatter, LogLevel, LOG_LEVEL_PRIORITY, LogMeta } from './types'
import { JsonFormatter } from './json-formatter'
import { PrettyFormatter } from './pretty-formatter'
import { getRequestId } from '@middleware/request-id.middleware'

// ---- Formatter selection ----

function resolveFormatter(): ILogFormatter {
  const isProduction = process.env.NODE_ENV === 'production'
  const format = process.env.LOG_FORMAT ?? (isProduction ? 'json' : 'pretty')
  return format === 'json' ? new JsonFormatter() : new PrettyFormatter()
}

function resolveMinLevel(): LogLevel {
  const isProduction = process.env.NODE_ENV === 'production'
  const defaultLevel: LogLevel = isProduction ? 'info' : 'debug'
  const raw = process.env.LOG_LEVEL ?? defaultLevel
  const valid: LogLevel[] = ['error', 'warn', 'info', 'debug']
  if (valid.includes(raw as LogLevel)) return raw as LogLevel
  console.warn(`[Logger] Invalid LOG_LEVEL="${raw}", falling back to "${defaultLevel}"`)
  return defaultLevel
}

// Resolved once at module load; respects env vars set before require().
let _formatter: ILogFormatter = resolveFormatter()
let _minLevel: LogLevel = resolveMinLevel()

/** Replace formatter at runtime (useful in tests). */
export function setFormatter(f: ILogFormatter): void {
  _formatter = f
}

/** Replace min level at runtime (useful in tests). */
export function setMinLevel(level: LogLevel): void {
  _minLevel = level
}

// ---- Core write function ----

function write(level: LogLevel, category: string, message: string, meta?: LogMeta): void {
  if (LOG_LEVEL_PRIORITY[level] > LOG_LEVEL_PRIORITY[_minLevel]) return

  // Automatically inject requestId from AsyncLocalStorage when available
  const requestId = getRequestId()
  const enrichedMeta: LogMeta | undefined =
    requestId !== undefined ? { requestId, ...meta } : meta

  const line = _formatter.format(level, category, message, enrichedMeta)

  switch (level) {
    case 'error':
      console.error(line)
      break
    case 'warn':
      console.warn(line)
      break
    case 'info':
      console.info(line)
      break
    case 'debug':
      console.debug(line)
      break
  }
}

// ---- ChildLogger ----

class ChildLogger implements ILogger {
  constructor(private readonly defaultMeta: LogMeta) {}

  error(message: string, meta?: LogMeta): void {
    write('error', 'APP', message, { ...this.defaultMeta, ...meta })
  }
  warn(message: string, meta?: LogMeta): void {
    write('warn', 'APP', message, { ...this.defaultMeta, ...meta })
  }
  info(message: string, meta?: LogMeta): void {
    write('info', 'APP', message, { ...this.defaultMeta, ...meta })
  }
  debug(message: string, meta?: LogMeta): void {
    write('debug', 'APP', message, { ...this.defaultMeta, ...meta })
  }
  child(extraMeta: LogMeta): ILogger {
    return new ChildLogger({ ...this.defaultMeta, ...extraMeta })
  }
}

// ---- Public Logger class (backward-compatible static API) ----

export class Logger {
  // ---- ILogger-compatible instance methods (for child loggers) ----

  static child(defaultMeta: LogMeta): ILogger {
    return new ChildLogger(defaultMeta)
  }

  // ---- Chatbot logging ----

  static chatbotInfo(message: string, data?: any): void {
    write('info', 'CHATBOT', message, data ? (data as LogMeta) : undefined)
  }
  static chatbotError(message: string, error?: any): void {
    write('error', 'CHATBOT', message, error ? (error as LogMeta) : undefined)
  }
  static chatbotWarn(message: string, data?: any): void {
    write('warn', 'CHATBOT', message, data ? (data as LogMeta) : undefined)
  }
  static chatbotDebug(message: string, data?: any): void {
    write('debug', 'CHATBOT', message, data ? (data as LogMeta) : undefined)
  }

  // ---- API logging ----

  static apiInfo(message: string, data?: any): void {
    write('info', 'API', message, data ? (data as LogMeta) : undefined)
  }
  static apiError(message: string, error?: any): void {
    write('error', 'API', message, error ? (error as LogMeta) : undefined)
  }
  static apiWarn(message: string, data?: any): void {
    write('warn', 'API', message, data ? (data as LogMeta) : undefined)
  }

  // ---- Database logging ----

  static dbInfo(message: string, data?: any): void {
    write('info', 'DATABASE', message, data ? (data as LogMeta) : undefined)
  }
  static dbError(message: string, error?: any): void {
    write('error', 'DATABASE', message, error ? (error as LogMeta) : undefined)
  }
  static dbWarn(message: string, data?: any): void {
    write('warn', 'DATABASE', message, data ? (data as LogMeta) : undefined)
  }

  // ---- Performance logging ----

  static performance(operation: string, duration: number, data?: any): void {
    const meta: LogMeta = { operation, duration_ms: duration, ...(data ?? {}) }
    write('info', 'PERFORMANCE', 'Operation completed', meta)
  }

  // ---- Request logging ----

  static request(method: string, url: string, userId?: string, data?: any): void {
    const meta: LogMeta = {
      method,
      url,
      userId,
      timestamp: new Date().toISOString(),
      ...(data ?? {}),
    }
    write('info', 'REQUEST', `${method} ${url}`, meta)
  }
}

/**
 * Factory function — creates a child logger with default metadata.
 * Equivalent to Logger.child(defaultMeta).
 */
export function createLogger(defaultMeta: LogMeta): ILogger {
  return Logger.child(defaultMeta)
}

// Re-export types for consumers
export { LogLevel, LogMeta, ILogger, ILogFormatter } from './types'

// ---- PerformanceTracker (unchanged from original) ----

export class PerformanceTracker {
  private startTime: number
  private operation: string

  constructor(operation: string) {
    this.operation = operation
    this.startTime = Date.now()
    Logger.chatbotDebug(`Starting operation: ${operation}`)
  }

  end(data?: any): number {
    const duration = Date.now() - this.startTime
    Logger.performance(this.operation, duration, data)
    return duration
  }
}
