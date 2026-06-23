import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { createAuthStorage } from '@shopee/shared-utils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api-ecom.lehoangtrong.com/'

const URL_LOGIN = 'login'
const URL_REFRESH_TOKEN = 'refresh-access-token'
const URL_LOGOUT = 'logout'

const authStorage = createAuthStorage({
  accessTokenKey: 'accessToken',
  refreshTokenKey: 'refreshToken',
  profileKey: 'profile',
})

function getAccessTokenFromLS() {
  return authStorage.getAccessToken()
}
function getRefreshTokenFromLS() {
  return authStorage.getRefreshToken()
}
function setAccessTokenToLS(token: string) {
  authStorage.setAccessToken(token)
}
function setRefreshTokenToLS(token: string) {
  authStorage.setRefreshToken(token)
}
function setProfileToLS(profile: unknown) {
  authStorage.setProfile(profile)
}
function clearLS() {
  authStorage.clearAll()
}

// Callback for handling auth failure navigation (single consumer — router layer)
let onAuthFailure: (() => void) | null = null
export function setOnAuthFailure(cb: () => void) {
  onAuthFailure = cb
}

// Callback for syncing token refresh with external state (single consumer — auth store)
let onTokenRefreshed: ((accessToken: string) => void) | null = null
export function setOnTokenRefreshed(cb: (accessToken: string) => void) {
  onTokenRefreshed = cb
}

export class Http {
  readonly instance: AxiosInstance
  private accessToken: string
  private refreshToken: string
  private refreshTokenRequest: Promise<string> | null

  /** Sync the in-memory token fields without touching localStorage.
   *  Used by the 2FA completion flow after writing tokens to LS. */
  setInMemoryTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }

  constructor() {
    this.accessToken = getAccessTokenFromLS()
    this.refreshToken = getRefreshTokenFromLS()
    this.refreshTokenRequest = null
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.instance.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.headers) {
          config.headers.authorization = this.accessToken
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    this.instance.interceptors.response.use(
      (response) => {
        const { url } = response.config
        if (url === URL_LOGIN) {
          const data = response.data as {
            data: { access_token?: string; refresh_token?: string; user?: unknown }
          }
          // Only persist tokens when access_token is present.
          // A requires2FA login response lacks access_token — returning the
          // response untouched lets LoginPage.onSubmit branch on requires2FA.
          if (data.data.access_token) {
            this.accessToken = data.data.access_token
            this.refreshToken = data.data.refresh_token ?? ''
            setAccessTokenToLS(this.accessToken)
            setRefreshTokenToLS(this.refreshToken)
            setProfileToLS(data.data.user)
          }
        } else if (url === URL_LOGOUT) {
          this.accessToken = ''
          this.refreshToken = ''
          clearLS()
        }
        return response
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401 && error.config?.url !== URL_REFRESH_TOKEN) {
          this.refreshTokenRequest = this.refreshTokenRequest ?? this.handleRefreshToken()
          try {
            const accessToken = await this.refreshTokenRequest
            // Retry original request
            const config = error.config as AxiosRequestConfig
            if (config.headers) {
              config.headers.authorization = accessToken
            }
            return this.instance(config)
          } catch {
            clearLS()
            this.accessToken = ''
            this.refreshToken = ''
            if (onAuthFailure) {
              onAuthFailure()
            } else {
              window.location.href = '/login'
            }
            throw error
          } finally {
            this.refreshTokenRequest = null
          }
        }
        return Promise.reject(error)
      },
    )
  }

  private async handleRefreshToken() {
    return this.instance
      .post<{ data: { access_token: string } }>(URL_REFRESH_TOKEN, {
        refresh_token: this.refreshToken,
      })
      .then((res) => {
        const { access_token } = res.data.data
        setAccessTokenToLS(access_token)
        this.accessToken = access_token
        onTokenRefreshed?.(access_token)
        return access_token
      })
      .catch((error) => {
        clearLS()
        this.accessToken = ''
        this.refreshToken = ''
        throw error
      })
  }
}

const httpInstance = new Http()
const http = httpInstance.instance
export default http

/** Update the Http singleton's in-memory tokens after the 2FA completion flow
 *  writes tokens to localStorage.  Call this immediately after setAccessTokenToLS
 *  / setRefreshTokenToLS so the Axios request interceptor sees the new token. */
export function setInMemoryTokens(accessToken: string, refreshToken: string) {
  httpInstance.setInMemoryTokens(accessToken, refreshToken)
}

export {
  getAccessTokenFromLS,
  getRefreshTokenFromLS,
  setAccessTokenToLS,
  setRefreshTokenToLS,
  setProfileToLS,
  clearLS,
  URL_LOGIN,
  URL_LOGOUT,
  URL_REFRESH_TOKEN,
}
