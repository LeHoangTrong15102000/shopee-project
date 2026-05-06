/**
 * Backward-compatibility re-export.
 *
 * All existing imports of the form:
 *   import { Logger } from '@utils/logger'
 *   import { PerformanceTracker } from '@utils/logger'
 *   import { LogLevel } from '@utils/logger'
 *
 * continue to work without any changes in the 43 consumer files.
 *
 * The actual implementation lives in @utils/logger/index.ts.
 */
export { Logger, PerformanceTracker, createLogger, setFormatter, setMinLevel } from './logger/index'
export type { LogLevel, LogMeta, ILogger, ILogFormatter } from './logger/types'
