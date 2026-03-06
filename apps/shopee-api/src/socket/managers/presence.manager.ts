import { Logger } from '@utils/logger'

interface PresenceEntry {
  socketIds: Set<string>
  lastSeen: Date | null
}

// In-memory presence store: userId -> PresenceEntry
const presenceMap = new Map<string, PresenceEntry>()

/**
 * Mark a user as online by adding their socket ID
 */
export const addUserSocket = (userId: string, socketId: string): void => {
  let entry = presenceMap.get(userId)
  if (!entry) {
    entry = { socketIds: new Set(), lastSeen: null }
    presenceMap.set(userId, entry)
  }
  entry.socketIds.add(socketId)
  Logger.apiInfo('Presence: user socket added', { userId, socketId, totalSockets: entry.socketIds.size })
}

/**
 * Remove a socket ID from a user's presence. Returns true if user went fully offline.
 */
export const removeUserSocket = (userId: string, socketId: string): boolean => {
  const entry = presenceMap.get(userId)
  if (!entry) return false

  entry.socketIds.delete(socketId)

  if (entry.socketIds.size === 0) {
    entry.lastSeen = new Date()
    Logger.apiInfo('Presence: user went offline', { userId, lastSeen: entry.lastSeen.toISOString() })
    return true
  }

  Logger.apiInfo('Presence: user socket removed (still online)', { userId, socketId, remainingSockets: entry.socketIds.size })
  return false
}

/**
 * Check if a user is currently online
 */
export const isUserOnline = (userId: string): boolean => {
  const entry = presenceMap.get(userId)
  return entry ? entry.socketIds.size > 0 : false
}

/**
 * Get a user's presence status and last seen time
 */
export const getUserPresence = (userId: string): { status: 'online' | 'offline'; lastSeen: string | null } => {
  const entry = presenceMap.get(userId)
  if (!entry) {
    return { status: 'offline', lastSeen: null }
  }
  if (entry.socketIds.size > 0) {
    return { status: 'online', lastSeen: null }
  }
  return { status: 'offline', lastSeen: entry.lastSeen?.toISOString() ?? null }
}

/**
 * Get count of online users (for monitoring)
 */
export const getOnlineUserCount = (): number => {
  let count = 0
  for (const entry of presenceMap.values()) {
    if (entry.socketIds.size > 0) count++
  }
  return count
}

