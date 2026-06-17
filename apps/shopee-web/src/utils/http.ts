// viết lại file utils cho nó sạch
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { toast } from 'react-toastify'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'
import i18n from 'src/i18n/i18n'
import { AuthResponse, RefreshTokenResponse } from 'src/types/auth.type'
import {
  clearLS,
  getAccessTokenFromLS,
  getRefreshTokenFromLS,
  setAccessTokenToLS,
  setProfileToLS,
  setRefreshTokenToLS,
} from './auth'
import {
  isAxiosExpiredTokenError,
  isAxiosPasswordChangedError,
  isAxiosUnauthorizedError,
} from '@shopee/shared-utils'

import { URL_LOGIN, URL_LOGOUT, URL_REFRESH_TOKEN, URL_REGISTER } from 'src/apis/auth.api'
import config from 'src/constant/config'
import { ErrorResponseApi } from 'src/types/utils.type'

// Developer thì phải biết design pattern,

// type InternalAxiosRequestConfig chỉ xuất hiện ở phiên bản axios 1.2.4

// Sử dụng import.meta.env của Vite thay vì process.env (không hoạt động trong browser)
// Ưu tiên VITE_LOGIN_REDIRECT_URL; nếu không có thì:
// - DEV: trỏ về dev server (localhost:4000)
// - PROD: dẫn xuất từ config.siteUrl (single source of truth, tránh hard-code lặp domain)
const LOGIN_REDIRECT_URL =
  import.meta.env.VITE_LOGIN_REDIRECT_URL ??
  (import.meta.env.DEV
    ? 'http://localhost:4000/login'
    : `${config.siteUrl.replace(/\/+$/, '')}/login`)

interface HttpOptions {
  redirectOnTokenExpiry?: boolean
}

// Note: Request deduplication, retry logic, and abort handling are managed by
// TanStack React Query at the application layer — not in this HTTP client.
export class Http {
  readonly instance: AxiosInstance
  private accessToken: string
  private refreshToken: string
  private refreshTokenRequest: Promise<string> | null
  private redirectOnTokenExpiry: boolean
  private redirectTimer: ReturnType<typeof setTimeout> | null

  /** Sync the in-memory token fields without touching localStorage.
   *  Used by the 2FA completion flow after writing tokens to LS. */
  setInMemoryTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }
  constructor(options?: HttpOptions) {
    // this.accessToken sẽ lưu vào RAM nên lấy ra sẽ nhanh hơn
    this.accessToken = getAccessTokenFromLS()
    this.refreshToken = getRefreshTokenFromLS()
    this.refreshTokenRequest = null
    this.redirectOnTokenExpiry = options?.redirectOnTokenExpiry ?? true
    this.redirectTimer = null
    this.instance = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'expire-access-token': 60 * 60 * 24,
        'refresh-access-token': 60 * 60 * 24 * 7,
      },
      // withCredentials: true
    })
    this.instance.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.headers) {
          config.headers.authorization = this.accessToken

          return config
        }
        return config
      },
      (error) => {
        // console.log('Error', error)
        return Promise.reject(error)
      },
    )
    this.instance.interceptors.response.use(
      (response) => {
        const { url } = response.config

        if (url === URL_LOGIN || url === URL_REGISTER) {
          const { data } = response.data as AuthResponse
          // Only persist tokens and profile when access_token is present.
          // A requires2FA login response lacks access_token — returning the
          // response untouched lets Login.tsx branch on res.data.data.requires2FA.
          // URL_REGISTER always carries access_token so it is unaffected.
          if (data.access_token) {
            this.accessToken = data.access_token
            this.refreshToken = data.refresh_token
            setAccessTokenToLS(this.accessToken)
            setRefreshTokenToLS(this.refreshToken)
            setProfileToLS(data.user)
          }
        } else if (url === URL_LOGOUT) {
          clearLS()
          this.accessToken = ''
          this.refreshToken = ''
        }

        return response
      },
      async (error: AxiosError) => {
        // Nếu không phải lỗi liên quan đến 422 hoặc là 401
        const status = error.response?.status
        if (
          status !== undefined &&
          ![HTTP_STATUS_CODE.UnprocessableEntity, HTTP_STATUS_CODE.Unauthorized].includes(status)
        ) {
          const data = error.response?.data as { message?: string } | undefined
          const message = data?.message || error.message
          toast.error(message)
        }

        // Lỗi Unauthorized (401) có rất nhiều trường hợp
        /**
         * 1. Token không đúng
         * 2. Không truyền token
         * 3. token hết hạn
         */

        // Nếu là lỗi 401
        if (isAxiosUnauthorizedError<ErrorResponseApi<{ name: string; message: string }>>(error)) {
          const config = error.response?.config ?? ({} as AxiosRequestConfig)
          // const config = error.response?.config || ({ headers: {} } as AxiosRequestConfig) -> dùng như này hoặc là như trên đều được
          const { url } = config

          // Nếu đã là lỗi 401 thì kiểm tra tiếp có phải là access_token hết hạn hay không
          if (isAxiosExpiredTokenError(error) && url !== URL_REFRESH_TOKEN) {
            this.refreshTokenRequest = this.refreshTokenRequest
              ? this.refreshTokenRequest
              : this.handleRefreshToken().finally(() => {
                  this.refreshTokenRequest = null
                })

            return this.refreshTokenRequest.then((access_token) => {
              return this.instance({
                ...config,
                headers: { ...(config.headers || {}), authorization: access_token },
              })
            })
          }

          // Khi mà đã hết token rồi thì chúng ta sẽ remove localStorage đi và window.location.reload() -> Nhưng mà cách này nó không đủ hay -> Cách hay hơn đó là dùng EventTarget()

          // Còn nếu không nhảy vào trường hợp ở trên thì có thể là do refreshToken hết hạn

          clearLS()
          this.accessToken = ''
          this.refreshToken = ''
          const errorMessage = isAxiosPasswordChangedError(error)
            ? i18n.t('common:password_changed')
            : (error.response?.data?.data?.message ??
              error.response?.data.message ??
              i18n.t('common:session_expired'))
          toast.error(errorMessage, { autoClose: 1000 })
          if (this.redirectOnTokenExpiry) {
            if (this.redirectTimer) clearTimeout(this.redirectTimer)
            const loginPath = new URL(LOGIN_REDIRECT_URL).pathname
            if (import.meta.env.MODE === 'test') {
              // In test mode, redirect synchronously via pushState (no timer to leak)
              window.history.pushState({}, '', loginPath)
            } else {
              this.redirectTimer = setTimeout(() => {
                window.location.replace(LOGIN_REDIRECT_URL)
              }, 1000)
            }
          }
          // khi mà hết hạn refresh_token thì chúng ta sẽ quay lại trang đầu tiên
        }
        return Promise.reject(error)
      },
    )
  }
  private async handleRefreshToken() {
    // console.log('Refresh chạy vào đây ------------')
    // Nếu chúng ta không return thì nó sẽ trả về Promise() và không thể .finally() được
    return this.instance
      .post<RefreshTokenResponse>(URL_REFRESH_TOKEN, {
        // Bắt buộc phải truyền lên `refresh_token` đúng chữ vì ở dưới backend yêu cầu như vậy
        refresh_token: this.refreshToken,
      })
      .then((res) => {
        const { access_token, refresh_token } = res.data.data
        setAccessTokenToLS(access_token)
        setRefreshTokenToLS(refresh_token)
        this.accessToken = access_token
        this.refreshToken = refresh_token

        // return về access_token để khi gọi hàm handleRefreshToken thì sẽ lấy được access_token
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

/** Update the Http singleton's in-memory tokens after the 2FA completion flow
 *  writes tokens to localStorage.  Call this immediately after setAccessTokenToLS
 *  / setRefreshTokenToLS so the Axios request interceptor sees the new token. */
export function setInMemoryTokens(accessToken: string, refreshToken: string) {
  httpInstance.setInMemoryTokens(accessToken, refreshToken)
}

export default http
