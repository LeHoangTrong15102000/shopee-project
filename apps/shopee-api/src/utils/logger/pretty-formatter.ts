import chalk = require('chalk')
import { ILogFormatter, LogLevel, LogMeta } from './types'

/**
 * Chalk color map per log level.
 */
const LEVEL_COLORS: Record<LogLevel, chalk.Chalk> = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.blue,
  debug: chalk.gray,
}

/**
 * Pretty (human-readable) log formatter for development.
 *
 * Output format:
 *   [timestamp] [LEVEL] [CATEGORY] [requestId?] message { meta? }
 *
 * - Colors are applied via chalk.
 * - requestId is included when present in meta.
 * - Meta is pretty-printed with 2-space indentation.
 * - Error objects show name, message, and stack.
 */
export class PrettyFormatter implements ILogFormatter {
  format(level: LogLevel, category: string, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString()
    const color = LEVEL_COLORS[level] ?? chalk.white
    const levelTag = color(`[${level.toUpperCase()}]`)
    const categoryTag = chalk.cyan(`[${category}]`)

    // Extract requestId from meta so it gets its own slot in the output
    let requestIdTag = ''
    let remainingMeta: LogMeta | undefined

    if (meta && Object.keys(meta).length > 0) {
      const { requestId, ...rest } = meta as { requestId?: unknown } & LogMeta
      if (requestId !== undefined) {
        requestIdTag = chalk.magenta(`[${requestId}]`)
      }
      remainingMeta = Object.keys(rest).length > 0 ? rest : undefined
    }

    const parts = [`[${timestamp}]`, levelTag, categoryTag]
    if (requestIdTag) parts.push(requestIdTag)
    parts.push(message)

    if (remainingMeta) {
      const serialized = serializeMeta(remainingMeta)
      parts.push(serialized)
    }

    return parts.join(' ')
  }
}

/**
 * Serialize meta for pretty output.
 * Errors are expanded to show name, message, and stack.
 */
function serializeMeta(meta: LogMeta): string {
  const expanded: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (v instanceof Error) {
      expanded[k] = { name: v.name, message: v.message, stack: v.stack ?? '' }
    } else {
      expanded[k] = v
    }
  }
  try {
    return JSON.stringify(expanded, null, 2)
  } catch {
    return '[non-serializable meta]'
  }
}
