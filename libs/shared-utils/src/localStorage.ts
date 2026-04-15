export interface AuthStorageConfig {
  accessTokenKey: string
  refreshTokenKey: string
  profileKey: string
}

export function createAuthStorage(config: AuthStorageConfig) {
  return {
    getAccessToken(): string {
      return localStorage.getItem(config.accessTokenKey) ?? ''
    },
    setAccessToken(token: string): void {
      localStorage.setItem(config.accessTokenKey, token)
    },
    getRefreshToken(): string {
      return localStorage.getItem(config.refreshTokenKey) ?? ''
    },
    setRefreshToken(token: string): void {
      localStorage.setItem(config.refreshTokenKey, token)
    },
    getProfile<T>(): T | null {
      try {
        const result = localStorage.getItem(config.profileKey)
        return result ? JSON.parse(result) : null
      } catch {
        return null
      }
    },
    setProfile(profile: unknown): void {
      localStorage.setItem(config.profileKey, JSON.stringify(profile))
    },
    clearAll(): void {
      localStorage.removeItem(config.accessTokenKey)
      localStorage.removeItem(config.refreshTokenKey)
      localStorage.removeItem(config.profileKey)
    },
  }
}
