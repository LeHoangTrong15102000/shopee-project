/**
 * Test Database Setup
 * Uses mongodb-memory-server for isolated integration/E2E testing
 */
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongoServer: MongoMemoryServer | null = null

/**
 * Start MongoMemoryServer and connect mongoose
 */
export const connectTestDB = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create()
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
 * Disconnect mongoose and stop MongoMemoryServer
 */
export const disconnectTestDB = async (): Promise<void> => {
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
    mongoServer = null
  }
}

