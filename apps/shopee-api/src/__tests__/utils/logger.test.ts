/// <reference types="jest" />

import { Logger, LogLevel, PerformanceTracker } from '@utils/logger'

describe('Logger', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  describe('LogLevel enum', () => {
    it('has ERROR value', () => {
      expect(LogLevel.ERROR).toBe('ERROR')
    })

    it('has WARN value', () => {
      expect(LogLevel.WARN).toBe('WARN')
    })

    it('has INFO value', () => {
      expect(LogLevel.INFO).toBe('INFO')
    })

    it('has DEBUG value', () => {
      expect(LogLevel.DEBUG).toBe('DEBUG')
    })
  })

  describe('chatbot logging methods', () => {
    it('chatbotInfo calls console.info', () => {
      Logger.chatbotInfo('test message')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[CHATBOT]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('test message')
    })

    it('chatbotInfo includes data when provided', () => {
      Logger.chatbotInfo('test message', { key: 'value' })
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('"key": "value"')
    })

    it('chatbotError calls console.error', () => {
      Logger.chatbotError('error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[CHATBOT]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('error message')
    })

    it('chatbotError includes error data when provided', () => {
      const error = new Error('test error')
      Logger.chatbotError('error message', error)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('chatbotWarn calls console.warn', () => {
      Logger.chatbotWarn('warn message')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[CHATBOT]')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('warn message')
    })

    it('chatbotDebug calls console.debug', () => {
      Logger.chatbotDebug('debug message')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('[DEBUG]')
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('[CHATBOT]')
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('debug message')
    })
  })

  describe('API logging methods', () => {
    it('apiInfo calls console.info', () => {
      Logger.apiInfo('api info message')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[API]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('api info message')
    })

    it('apiError calls console.error', () => {
      Logger.apiError('api error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[API]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('api error message')
    })

    it('apiWarn calls console.warn', () => {
      Logger.apiWarn('api warn message')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[API]')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('api warn message')
    })
  })

  describe('Database logging methods', () => {
    it('dbInfo calls console.info', () => {
      Logger.dbInfo('db info message')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[DATABASE]')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('db info message')
    })

    it('dbError calls console.error', () => {
      Logger.dbError('db error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[DATABASE]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('db error message')
    })

    it('dbWarn calls console.warn', () => {
      Logger.dbWarn('db warn message')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[DATABASE]')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('db warn message')
    })
  })

  describe('performance logging', () => {
    it('logs with PERFORMANCE category', () => {
      Logger.performance('test_operation', 150)
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[PERFORMANCE]')
    })

    it('includes operation name in log', () => {
      Logger.performance('test_operation', 150)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('test_operation')
    })

    it('includes duration in log', () => {
      Logger.performance('test_operation', 150)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('"duration_ms": 150')
    })

    it('includes additional data when provided', () => {
      Logger.performance('test_operation', 150, { tokens: 100 })
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('"tokens": 100')
    })
  })

  describe('request logging', () => {
    it('logs with REQUEST category', () => {
      Logger.request('GET', '/api/users')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[REQUEST]')
    })

    it('includes method in log', () => {
      Logger.request('POST', '/api/users')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('POST')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('"method": "POST"')
    })

    it('includes url in log', () => {
      Logger.request('GET', '/api/products')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('/api/products')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('"url": "/api/products"')
    })

    it('includes userId when provided', () => {
      Logger.request('GET', '/api/users', 'user123')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('"userId": "user123"')
    })

    it('includes additional data when provided', () => {
      Logger.request('GET', '/api/users', undefined, { status: 200 })
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('"status": 200')
    })
  })
})

describe('PerformanceTracker', () => {
  let consoleInfoSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
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

  it('end() calls Logger.performance', () => {
    const tracker = new PerformanceTracker('test_operation')
    tracker.end()
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('[PERFORMANCE]')
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('test_operation')
  })

  it('end() includes additional data when provided', () => {
    const tracker = new PerformanceTracker('api_call')
    tracker.end({ tokens: 150, model: 'claude-3-haiku' })
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('"tokens": 150')
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('"model": "claude-3-haiku"')
  })

  it('tracks actual elapsed time', async () => {
    const tracker = new PerformanceTracker('delayed_operation')
    await new Promise((resolve) => setTimeout(resolve, 50))
    const duration = tracker.end()
    expect(duration).toBeGreaterThanOrEqual(40)
  })
})
