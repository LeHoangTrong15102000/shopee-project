/**
 * Logger type definitions.
 *
 * ILogger — the public interface every logger implementation must satisfy.
 * LogMeta — arbitrary structured metadata attached to a log entry.
 * ILogFormatter — strategy interface for formatting a log entry to a string.
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

/**
 * Numeric priority for each level — lower number = higher priority.
 * Used to filter out log entries below the configured minimum level.
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

/**
 * Arbitrary key-value metadata attached to a log entry.
 * Values may be primitives, objects, arrays, or Error instances.
 */
export type LogMeta = Record<string, unknown>

/**
 * A child logger carries default metadata (e.g. requestId) that is merged
 * into every log entry it produces.
 */
export interface ILogger {
  error(message: string, meta?: LogMeta): void
  warn(message: string, meta?: LogMeta): void
  info(message: string, meta?: LogMeta): void
  debug(message: string, meta?: LogMeta): void

  /**
   * Create a child logger that merges defaultMeta into every log entry.
   * Typical usage: Logger.child({ requestId: req.requestId })
   */
  child(defaultMeta: LogMeta): ILogger
}

/**
 * Strategy interface for formatting a log entry into an output string.
 * Implementations: JsonFormatter, PrettyFormatter.
 */
export interface ILogFormatter {
  format(level: LogLevel, category: string, message: string, meta?: LogMeta): string
}
