/**
 * Test Database Setup
 * Uses mongodb-memory-server for isolated integration/E2E testing.
 * MongoMemoryReplSet is used (instead of MongoMemoryServer) so that
 * Mongoose sessions and multi-document transactions work correctly —
 * MongoDB requires a replica set member for transaction support.
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongoServer: MongoMemoryReplSet | null = null

/**
 * Start a single-node MongoMemoryReplSet and connect mongoose.
 * The replica set is required for transaction support (withTransaction helper).
 */
export const connectTestDB = async (): Promise<void> => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
}

/**
 * Drop all collections — call in beforeEach for clean state
 */
export const clearTestDB = async (): Promise<void> => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

/**
 * Disconnect mongoose and stop MongoMemoryReplSet
 */
export const disconnectTestDB = async (): Promise<void> => {
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
    mongoServer = null
  }
}
