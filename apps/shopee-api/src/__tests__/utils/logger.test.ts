/// <reference types="jest" />

/**
 * Tests for the structured Logger (new implementation).
 *
 * The logger uses PrettyFormatter by default in test env (LOG_FORMAT not set → pretty).
 * LOG_LEVEL defaults to 'debug' in test env.
 *
 * We use setFormatter() and setMinLevel() to control behavior in tests,
 * and restore them in afterEach to avoid cross-test pollution.
 */

import {
  Logger,
  PerformanceTracker,
  setFormatter,
  setMinLevel,
  createLogger,
  LogLevel,
  LogMeta,
  ILogFormatter,
} from '@utils/logger'

// Strip ANSI color codes so we can assert on plain text
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*m/g, '')
}

// A simple spy formatter that captures calls for inspection
class SpyFormatter implements ILogFormatter {
  calls: Array<{ level: LogLevel; category: string; message: string; meta?: LogMeta }> = []

  format(level: LogLevel, category: string, message: string, meta?: LogMeta): string {
    this.calls.push({ level, category, message, meta })
    return `[${level.toUpperCase()}] [${category}] ${message}`
  }

  reset(): void {
    this.calls = []
  }
}

describe('Logger — log level filtering', () => {
  let spyFormatter: SpyFormatter
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    spyFormatter = new SpyFormatter()
    setFormatter(spyFormatter)
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    // Restore defaults for test env
    setMinLevel('debug')
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  it('default level in test env is debug — all levels pass through', () => {
    setMinLevel('debug')
    Logger.chatbotError('e')
    Logger.chatbotWarn('w')
    Logger.chatbotInfo('i')
    Logger.chatbotDebug('d')
    expect(spyFormatter.calls).toHaveLength(4)
  })

  it('setMinLevel("warn") — only error and warn pass through', () => {
    setMinLevel('warn')
    Logger.chatbotError('e')
    Logger.chatbotWarn('w')
    Logger.chatbotInfo('i')
    Logger.chatbotDebug('d')
    expect(spyFormatter.calls).toHaveLength(2)
    expect(spyFormatter.calls[0].level).toBe('error')
    expect(spyFormatter.calls[1].level).toBe('warn')
  })

  it('setMinLevel("error") — only error passes through', () => {
    setMinLevel('error')
    Logger.chatbotError('e')
    Logger.chatbotWarn('w')
    Logger.chatbotInfo('i')
    Logger.chatbotDebug('d')
    expect(spyFormatter.calls).toHaveLength(1)
    expect(spyFormatter.calls[0].level).toBe('error')
  })

  it('setMinLevel("info") — error, warn, info pass; debug is discarded', () => {
    setMinLevel('info')
    Logger.chatbotError('e')
    Logger.chatbotWarn('w')
    Logger.chatbotInfo('i')
    Logger.chatbotDebug('d')
    expect(spyFormatter.calls).toHaveLength(3)
    expect(spyFormatter.calls.map((c) => c.level)).toEqual(['error', 'warn', 'info'])
  })

  it('setMinLevel("debug") — all four levels pass', () => {
    setMinLevel('debug')
    Logger.chatbotError('e')
    Logger.chatbotWarn('w')
    Logger.chatbotInfo('i')
    Logger.chatbotDebug('d')
    expect(spyFormatter.calls).toHaveLength(4)
  })
})

describe('Logger — static methods (backward compatibility)', () => {
  let spyFormatter: SpyFormatter
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    spyFormatter = new SpyFormatter()
    setFormatter(spyFormatter)
    setMinLevel('debug')
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    setMinLevel('debug')
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  describe('chatbot methods', () => {
    it('chatbotInfo calls console.info with CHATBOT category', () => {
      Logger.chatbotInfo('test message')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[CHATBOT]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('test message')
    })

    it('chatbotInfo passes data as meta', () => {
      Logger.chatbotInfo('msg', { key: 'value' })
      expect(spyFormatter.calls[0].meta).toMatchObject({ key: 'value' })
    })

    it('chatbotError calls console.error with CHATBOT category', () => {
      Logger.chatbotError('error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[CHATBOT]')
    })

    it('chatbotWarn calls console.warn with CHATBOT category', () => {
      Logger.chatbotWarn('warn message')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[CHATBOT]')
    })

    it('chatbotDebug calls console.debug with CHATBOT category', () => {
      Logger.chatbotDebug('debug message')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('[DEBUG]')
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('[CHATBOT]')
    })
  })

  describe('API methods', () => {
    it('apiInfo calls console.info with API category', () => {
      Logger.apiInfo('api info message')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[API]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('api info message')
    })

    it('apiError calls console.error with API category', () => {
      Logger.apiError('api error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[API]')
    })

    it('apiWarn calls console.warn with API category', () => {
      Logger.apiWarn('api warn message')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[API]')
    })
  })

  describe('database methods', () => {
    it('dbInfo calls console.info with DATABASE category', () => {
      Logger.dbInfo('db info message')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[DATABASE]')
    })

    it('dbError calls console.error with DATABASE category', () => {
      Logger.dbError('db error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[DATABASE]')
    })

    it('dbWarn calls console.warn with DATABASE category', () => {
      Logger.dbWarn('db warn message')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[DATABASE]')
    })
  })

  describe('performance logging', () => {
    it('logs with PERFORMANCE category', () => {
      Logger.performance('test_operation', 150)
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(spyFormatter.calls[0].category).toBe('PERFORMANCE')
    })

    it('includes operation and duration_ms in meta', () => {
      Logger.performance('test_operation', 150)
      expect(spyFormatter.calls[0].meta).toMatchObject({
        operation: 'test_operation',
        duration_ms: 150,
      })
    })

    it('includes additional data when provided', () => {
      Logger.performance('test_operation', 150, { tokens: 100 })
      expect(spyFormatter.calls[0].meta).toMatchObject({ tokens: 100 })
    })
  })

  describe('request logging', () => {
    it('logs with REQUEST category', () => {
      Logger.request('GET', '/api/users')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(spyFormatter.calls[0].category).toBe('REQUEST')
    })

    it('includes method and url in meta', () => {
      Logger.request('POST', '/api/users')
      expect(spyFormatter.calls[0].meta).toMatchObject({ method: 'POST', url: '/api/users' })
    })

    it('includes userId when provided', () => {
      Logger.request('GET', '/api/users', 'user123')
      expect(spyFormatter.calls[0].meta).toMatchObject({ userId: 'user123' })
    })

    it('includes additional data when provided', () => {
      Logger.request('GET', '/api/users', undefined, { status: 200 })
      expect(spyFormatter.calls[0].meta).toMatchObject({ status: 200 })
    })
  })
})

describe('Logger.child()', () => {
  let spyFormatter: SpyFormatter
  let consoleInfoSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    spyFormatter = new SpyFormatter()
    setFormatter(spyFormatter)
    setMinLevel('debug')
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    setMinLevel('debug')
    consoleInfoSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('creates a child logger that merges default meta', () => {
    const child = Logger.child({ requestId: 'req-123', service: 'auth' })
    child.info('hello')
    expect(spyFormatter.calls[0].meta).toMatchObject({ requestId: 'req-123', service: 'auth' })
  })

  it('child logger merges call-site meta over default meta', () => {
    const child = Logger.child({ requestId: 'req-123' })
    child.info('hello', { extra: 'data' })
    expect(spyFormatter.calls[0].meta).toMatchObject({ requestId: 'req-123', extra: 'data' })
  })

  it('child.child() creates nested child with merged meta', () => {
    const child = Logger.child({ requestId: 'req-123' })
    const grandchild = child.child({ userId: 'u1' })
    grandchild.info('nested')
    expect(spyFormatter.calls[0].meta).toMatchObject({ requestId: 'req-123', userId: 'u1' })
  })

  it('child logger error() calls console.error', () => {
    const child = Logger.child({ requestId: 'req-abc' })
    child.error('something broke')
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
  })

  it('child logger respects min level filtering', () => {
    setMinLevel('warn')
    const child = Logger.child({ requestId: 'req-abc' })
    child.info('filtered out')
    child.warn('passes through')
    expect(spyFormatter.calls).toHaveLength(1)
    expect(spyFormatter.calls[0].level).toBe('warn')
  })
})

describe('createLogger() factory', () => {
  let spyFormatter: SpyFormatter
  let consoleInfoSpy: jest.SpyInstance

  beforeEach(() => {
    spyFormatter = new SpyFormatter()
    setFormatter(spyFormatter)
    setMinLevel('debug')
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
  })

  afterEach(() => {
    setMinLevel('debug')
    consoleInfoSpy.mockRestore()
  })

  it('createLogger() returns a logger with default meta', () => {
    const logger = createLogger({ service: 'payment' })
    logger.info('processing')
    expect(spyFormatter.calls[0].meta).toMatchObject({ service: 'payment' })
  })

  it('createLogger() is equivalent to Logger.child()', () => {
    const a = createLogger({ x: 1 })
    const b = Logger.child({ x: 1 })
    a.info('from a')
    b.info('from b')
    expect(spyFormatter.calls[0].meta).toMatchObject({ x: 1 })
    expect(spyFormatter.calls[1].meta).toMatchObject({ x: 1 })
  })
})

describe('PerformanceTracker', () => {
  let consoleInfoSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    setMinLevel('debug')
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    setMinLevel('debug')
    consoleInfoSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  it('constructor logs debug message with operation name', () => {
    new PerformanceTracker('test_operation')
    expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
    expect(consoleDebugSpy.mock.calls[0][0]).toContain('Starting operation: test_operation')
  })

  it('end() returns duration as a number >= 0', () => {
    const tracker = new PerformanceTracker('test_operation')
    const duration = tracker.end()
    expect(typeof duration).toBe('number')
    expect(duration).toBeGreaterThanOrEqual(0)
  })

  it('end() calls Logger.performance (logs to console.info)', () => {
    const tracker = new PerformanceTracker('test_operation')
    tracker.end()
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('[PERFORMANCE]')
    // The operation name is in meta, not the message — check the formatted output contains it
    // SpyFormatter outputs: "[INFO] [PERFORMANCE] Operation completed"
    // The operation name is passed as meta.operation, visible in the spy formatter calls
  })

  it('end() includes additional data when provided', () => {
    const spyFormatter = new SpyFormatter()
    setFormatter(spyFormatter)
    const tracker = new PerformanceTracker('api_call')
    tracker.end({ tokens: 150, model: 'claude-3-haiku' })
    const perfCall = spyFormatter.calls.find((c) => c.category === 'PERFORMANCE')
    expect(perfCall?.meta).toMatchObject({ tokens: 150, model: 'claude-3-haiku' })
  })

  it('tracks actual elapsed time', async () => {
    const tracker = new PerformanceTracker('delayed_operation')
    await new Promise((resolve) => setTimeout(resolve, 50))
    const duration = tracker.end()
    expect(duration).toBeGreaterThanOrEqual(40)
  })
})
