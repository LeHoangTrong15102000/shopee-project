import chalk = require('chalk')

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString()
  }

  private static formatMessage(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
  ): string {
    const timestamp = this.formatTimestamp()
    const baseMessage = `[${timestamp}] [${level}] [${category}] ${message}`

    if (data) {
      return `${baseMessage} ${JSON.stringify(data, null, 2)}`
    }

    return baseMessage
  }

  private static log(level: LogLevel, category: string, message: string, data?: any): void {
    const formattedMessage = this.formatMessage(level, category, message, data)

    switch (level) {
      case LogLevel.ERROR:
        console.error(chalk.red(formattedMessage))
        break
      case LogLevel.WARN:
        console.warn(chalk.yellow(formattedMessage))
        break
      case LogLevel.INFO:
        console.info(chalk.blue(formattedMessage))
        break
      case LogLevel.DEBUG:
        console.debug(chalk.gray(formattedMessage))
        break
    }
  }

  // Chatbot specific logging methods
  static chatbotInfo(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'CHATBOT', message, data)
  }

  static chatbotError(message: string, error?: any): void {
    this.log(LogLevel.ERROR, 'CHATBOT', message, error)
  }

  static chatbotWarn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'CHATBOT', message, data)
  }

  static chatbotDebug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, 'CHATBOT', message, data)
  }

  // API logging methods
  static apiInfo(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'API', message, data)
  }

  static apiError(message: string, error?: any): void {
    this.log(LogLevel.ERROR, 'API', message, error)
  }

  static apiWarn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'API', message, data)
  }

  // Database logging methods
  static dbInfo(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'DATABASE', message, data)
  }

  static dbError(message: string, error?: any): void {
    this.log(LogLevel.ERROR, 'DATABASE', message, error)
  }

  static dbWarn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'DATABASE', message, data)
  }

  // Performance logging
  static performance(operation: string, duration: number, data?: any): void {
    const performanceData = {
      operation,
      duration_ms: duration,
      ...data,
    }
    this.log(LogLevel.INFO, 'PERFORMANCE', `Operation completed`, performanceData)
  }

  // Request logging
  static request(method: string, url: string, userId?: string, data?: any): void {
    const requestData = {
      method,
      url,
      userId,
      timestamp: this.formatTimestamp(),
      ...data,
    }
    this.log(LogLevel.INFO, 'REQUEST', `${method} ${url}`, requestData)
  }
}

// Performance tracking utility
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

// Usage example:
// const tracker = new PerformanceTracker('anthropic_api_call')
// // ... do work
// tracker.end({ tokens: 150, model: 'claude-3-haiku' })
