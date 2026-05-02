require('dotenv').config()
import { Logger } from '@utils/logger'
import chalk from 'chalk'
import mongoose from 'mongoose'

// Connection configuration
const DB_CONFIG = {
  maxRetries: 5,
  retryDelayMs: 5000,
  poolSize: 10,
  socketTimeoutMs: 45000,
  serverSelectionTimeoutMs: 10000,
  heartbeatFrequencyMs: 10000,
}

const dbURL = process.env.MONGO_URI as string
const connected = chalk.bold.cyan
const error = chalk.bold.yellow
const disconnected = chalk.bold.red
const termination = chalk.bold.magenta
const reconnecting = chalk.bold.blue

// Track connection state
let isConnecting = false
let connectionAttempts = 0
let isShuttingDown = false

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Connect to MongoDB with retry logic
 */
export const connectMongoDB = async (): Promise<void> => {
  if (isConnecting) {
    Logger.dbInfo('Connection attempt already in progress')
    return
  }

  isConnecting = true
  connectionAttempts = 0

  while (connectionAttempts < DB_CONFIG.maxRetries && !isShuttingDown) {
    try {
      connectionAttempts++
      Logger.dbInfo(`MongoDB connection attempt ${connectionAttempts}/${DB_CONFIG.maxRetries}`)

      await mongoose.connect(dbURL, {
        maxPoolSize: DB_CONFIG.poolSize,
        minPoolSize: 2,
        socketTimeoutMS: DB_CONFIG.socketTimeoutMs,
        serverSelectionTimeoutMS: DB_CONFIG.serverSelectionTimeoutMs,
        heartbeatFrequencyMS: DB_CONFIG.heartbeatFrequencyMs,
        retryWrites: true,
        retryReads: true,
      })

      console.log(connected('Mongoose default connection is open to MongoDB Atlas'))
      Logger.dbInfo('MongoDB connected successfully')
      isConnecting = false
      connectionAttempts = 0
      return
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.log(error(`MongoDB connection attempt ${connectionAttempts} failed: ${errorMessage}`))
      Logger.dbError(`MongoDB connection attempt ${connectionAttempts} failed`, {
        error: errorMessage,
      })

      if (connectionAttempts < DB_CONFIG.maxRetries && !isShuttingDown) {
        console.log(reconnecting(`Retrying in ${DB_CONFIG.retryDelayMs / 1000} seconds...`))
        await sleep(DB_CONFIG.retryDelayMs)
      }
    }
  }

  isConnecting = false
  if (!isShuttingDown) {
    Logger.dbError('Failed to connect to MongoDB after maximum retries')
    throw new Error('Failed to connect to MongoDB after maximum retries')
  }
}

/**
 * Setup connection event handlers for graceful reconnection
 */
const setupConnectionHandlers = (): void => {
  mongoose.connection.on('connected', () => {
    console.log(connected('Mongoose default connection is open to MongoDB Atlas'))
    connectionAttempts = 0
  })

  mongoose.connection.on('error', (err) => {
    console.log(error('Mongoose default connection has occured ' + err + ' error'))
    Logger.dbError('MongoDB connection error', { error: err.message })
  })

  mongoose.connection.on('disconnected', () => {
    console.log(disconnected('Mongoose default connection is disconnected'))
    Logger.dbWarn('MongoDB disconnected')

    // Attempt reconnection if not shutting down
    if (!isShuttingDown && !isConnecting) {
      console.log(reconnecting('Attempting to reconnect to MongoDB...'))
      Logger.dbInfo('Attempting MongoDB reconnection')
      void reconnectMongoDB()
    }
  })

  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT')
  })

  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM')
  })
}

/**
 * Attempt to reconnect to MongoDB
 */
const reconnectMongoDB = async (): Promise<void> => {
  if (isShuttingDown) return

  try {
    await connectMongoDB()
  } catch (err) {
    Logger.dbError('MongoDB reconnection failed', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) return

  isShuttingDown = true
  console.log(termination(`Received ${signal}. Starting graceful shutdown...`))
  Logger.dbInfo(`Graceful shutdown initiated by ${signal}`)

  try {
    await mongoose.connection.close()
    console.log(
      termination('Mongoose default connection is disconnected due to application termination'),
    )
    Logger.dbInfo('MongoDB connection closed successfully')
    process.exit(0)
  } catch (err) {
    Logger.dbError('Error during graceful shutdown', {
      error: err instanceof Error ? err.message : String(err),
    })
    process.exit(1)
  }
}

/**
 * Database health check
 * Returns health status including connection state and latency
 */
export interface DatabaseHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  connected: boolean
  readyState: number
  readyStateText: string
  latencyMs?: number
  error?: string
}

export const checkDatabaseHealth = async (): Promise<DatabaseHealthStatus> => {
  const readyStateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }

  const readyState = mongoose.connection.readyState
  const readyStateText = readyStateMap[readyState] || 'unknown'

  if (readyState !== 1) {
    return {
      status: 'unhealthy',
      connected: false,
      readyState,
      readyStateText,
      error: `Database not connected (state: ${readyStateText})`,
    }
  }

  // Ping the database to check latency
  try {
    const startTime = Date.now()
    await mongoose.connection.db?.admin().ping()
    const latencyMs = Date.now() - startTime

    // Consider degraded if latency is high (> 1000ms)
    const status = latencyMs > 1000 ? 'degraded' : 'healthy'

    return {
      status,
      connected: true,
      readyState,
      readyStateText,
      latencyMs,
    }
  } catch (err) {
    return {
      status: 'unhealthy',
      connected: false,
      readyState,
      readyStateText,
      error: err instanceof Error ? err.message : 'Ping failed',
    }
  }
}

/**
 * Check if database is ready for queries
 */
export const isDatabaseReady = (): boolean => {
  return mongoose.connection.readyState === 1
}

/**
 * Get connection pool statistics
 */
export const getConnectionPoolStats = (): {
  poolSize: number
  readyState: number
  host?: string
} => {
  return {
    poolSize: DB_CONFIG.poolSize,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
  }
}

// Initialize connection handlers
setupConnectionHandlers()

export const isValidId = (id: string) => {
  return mongoose.Types.ObjectId.isValid(id)
}

export const startSession = () => {
  return mongoose.startSession()
}

export { DB_CONFIG }
