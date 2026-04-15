import { create } from 'zustand'

export interface ActivityLogEntry {
  id: string
  action: 'create' | 'update' | 'delete'
  entityType: string
  entityName: string
  adminEmail: string
  timestamp: string
}

interface ActivityLogState {
  entries: ActivityLogEntry[]
  addLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void
  clearLog: () => void
}

const STORAGE_KEY = 'shopee-admin-activity-log'
const MAX_ENTRIES = 200

function loadEntries(): ActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveEntries(entries: ActivityLogEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export const useActivityLogStore = create<ActivityLogState>((set) => ({
  entries: loadEntries(),

  addLog: (entry) =>
    set((state) => {
      const newEntry: ActivityLogEntry = {
        ...entry,
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
      }
      const updated = [newEntry, ...state.entries].slice(0, MAX_ENTRIES)
      saveEntries(updated)
      return { entries: updated }
    }),

  clearLog: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ entries: [] })
  },
}))
