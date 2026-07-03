import { createMMKV } from 'react-native-mmkv'

// Shared MMKV instance (v4 API: MMKV is now a type; use the createMMKV factory)
export const storage = createMMKV()

// Zustand-compatible MMKV storage adapter (shared across stores)
export const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.remove(name),
}
