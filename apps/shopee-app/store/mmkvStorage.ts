import { MMKV } from 'react-native-mmkv'

// Shared MMKV instance
export const storage = new MMKV()

// Zustand-compatible MMKV storage adapter (shared across stores)
export const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
}
