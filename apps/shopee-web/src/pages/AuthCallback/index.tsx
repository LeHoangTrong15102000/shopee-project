import { useContext, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import authApi from 'src/apis/auth.api'
import { AppContext } from 'src/contexts/app.context'
import { setAccessTokenToLS, setRefreshTokenToLS, setProfileToLS } from 'src/utils/auth'
import { setInMemoryTokens } from 'src/utils/http'
import path from 'src/constant/path'

/**
 * AuthCallback — landing page for the Google OAuth server-side flow.
 *
 * Google redirects the browser here via the backend callback, which appends
 * either ?tmp=<handle> (success) or ?error=<reason> (failure).
 *
 * Flow:
 *  - ?error  → show error state with link back to Login
 *  - ?tmp    → call POST /auth/google/exchange-code, show loading spinner
 *    - success (AuthResult)          → persist tokens + update context → navigate('/')
 *    - 2FA required (partial_token)  → navigate to /login/2fa (TwoFactorVerify) with partial_token in state
 *    - API error                     → show error state with link back to Login
 *  - neither → invalid URL, show error state
 *
 * Token persistence is handled in-component via setAccessTokenToLS /
 * setRefreshTokenToLS / setProfileToLS — NOT via the http.ts interceptor.
 */
function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setIsAuthenticated, setProfile } = useContext(AppContext)

  const tmp = searchParams.get('tmp')
  const errorParam = searchParams.get('error')

  const { data, isError } = useQuery({
    queryKey: ['googleExchangeCode', tmp],
    queryFn: () => authApi.googleExchangeCode({ tmp: tmp! }),
    enabled: !!tmp && !errorParam,
    retry: false,
    // Don't cache — each tmp handle is single-use and expires in 60s
    staleTime: 0,
    gcTime: 0,
  })

  useEffect(() => {
    if (!data) return

    const result = data.data.data

    // 2FA case — route to the TOTP verify screen with the partial token.
    // The Login page no longer reads partial_token; TwoFactorVerify at
    // path.twoFactorVerify (/login/2fa) owns the TOTP entry UI.
    if ('requires2FA' in result && result.requires2FA) {
      navigate(path.twoFactorVerify, {
        replace: true,
        state: { partial_token: result.partial_token },
      })
      return
    }

    // Full auth result — persist tokens in-component, then navigate home
    if ('access_token' in result) {
      setAccessTokenToLS(result.access_token)
      setRefreshTokenToLS(result.refresh_token)
      setProfileToLS(result.user)
      // Sync the Http singleton's in-memory fields so the Axios request interceptor
      // sends the Authorization header on the immediately-following request after navigate('/').
      setInMemoryTokens(result.access_token, result.refresh_token)
      setIsAuthenticated(true)
      setProfile(result.user)
      navigate('/', { replace: true })
    }
  }, [data, navigate, setIsAuthenticated, setProfile])

  // Error from backend redirect (?error=...)
  if (errorParam) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
          <div
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 mx-auto dark:bg-red-900"
            aria-hidden="true"
          >
            <svg
              className="h-12 w-12 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mb-3 text-xl font-bold text-gray-800 dark:text-gray-100">
            Xác thực Google thất bại
          </h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            {errorParam === 'invalid_state' && 'Yêu cầu xác thực đã hết hạn hoặc không hợp lệ.'}
            {errorParam === 'exchange_failed' && 'Không thể xác thực với Google.'}
            {errorParam === 'service_unavailable' && 'Dịch vụ tạm thời không khả dụng.'}
            {!['invalid_state', 'exchange_failed', 'service_unavailable'].includes(errorParam) &&
              'Đã xảy ra lỗi trong quá trình xác thực.'}
          </p>
          <Link
            to={path.login}
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: '#ee4d2d' }}
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  // API error (exchange-code call failed)
  if (isError) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
          <div
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 mx-auto dark:bg-red-900"
            aria-hidden="true"
          >
            <svg
              className="h-12 w-12 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mb-3 text-xl font-bold text-gray-800 dark:text-gray-100">
            Xác thực không thành công
          </h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.
          </p>
          <Link
            to={path.login}
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: '#ee4d2d' }}
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  // Invalid URL — neither tmp nor error present
  if (!tmp && !errorParam) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
          <h1 className="mb-3 text-xl font-bold text-gray-800 dark:text-gray-100">
            Trang không hợp lệ
          </h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Không tìm thấy thông tin xác thực.
          </p>
          <Link
            to={path.login}
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: '#ee4d2d' }}
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  // Loading state (tmp present, query in flight)
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
        <div className="mb-6 flex justify-center" aria-label="Đang xác thực" role="status">
          <svg
            className="h-16 w-16 animate-spin text-orange-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-800 dark:text-gray-100">
          Đang đăng nhập bằng Google
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Vui lòng chờ trong giây lát...</p>
      </div>
    </div>
  )
}

export default AuthCallback
