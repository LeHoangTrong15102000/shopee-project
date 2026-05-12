import { useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import orderApi from 'src/apis/order.api'
import path from 'src/constant/path'

const POLL_INTERVAL_MS = 3000
const TIMEOUT_MS = 120_000 // 2 minutes
const TERMINAL_STATUSES = ['SUCCESS', 'FAILED']

function PaymentReturn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const provider = searchParams.get('provider')

  // Track mount time for 2-minute polling timeout
  const mountTimeRef = useRef<number>(Date.now())

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['paymentStatus', orderId],
    queryFn: () => orderApi.getPaymentStatus(orderId!),
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.data?.status

      // Stop polling on terminal status
      if (status && TERMINAL_STATUSES.includes(status)) return false

      // Stop polling after 2-minute timeout
      if (Date.now() - mountTimeRef.current >= TIMEOUT_MS) return false

      return POLL_INTERVAL_MS
    },
  })

  const status = data?.data?.data?.status
  const isTimedOut =
    !status || !TERMINAL_STATUSES.includes(status)
      ? Date.now() - mountTimeRef.current >= TIMEOUT_MS
      : false

  const handleRetry = useCallback(async () => {
    if (!orderId) return
    try {
      const result = await orderApi.retryPayment(orderId)
      const paymentUrl = result.data?.data?.paymentUrl
      if (paymentUrl) {
        window.location.href = paymentUrl
      }
    } catch {
      // Retry failed — stay on page, user can try again
    }
  }, [orderId])

  // Error state: missing orderId
  if (!orderId) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
          <div className="mb-4 text-5xl" aria-hidden="true">
            &#9888;
          </div>
          <h1 className="mb-3 text-xl font-bold text-gray-800 dark:text-gray-100">
            Thông tin đơn hàng không hợp lệ
          </h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Không tìm thấy mã đơn hàng. Vui lòng kiểm tra lại.
          </p>
          <button
            type="button"
            onClick={() => navigate(path.orderList)}
            className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: '#ee4d2d' }}
          >
            Xem đơn hàng
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (status === 'SUCCESS') {
    navigate(`${path.paymentSuccess}?orderId=${orderId}`, { replace: true })
    return null
  }

  // Failed state
  if (status === 'FAILED') {
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
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold text-gray-800 dark:text-gray-100">
            Thanh toán thất bại
          </h1>
          <p className="mb-2 text-gray-500 dark:text-gray-400">
            Giao dịch không thành công. Vui lòng thử lại.
          </p>
          {provider && (
            <p className="mb-6 text-sm text-gray-400 dark:text-gray-500">
              Nhà cung cấp: {provider.toUpperCase()}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: '#ee4d2d' }}
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={() => navigate(path.orderList)}
              className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-600 dark:text-gray-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
            >
              Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Timeout state (2 minutes elapsed, still no terminal status)
  if (isTimedOut) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
          <div
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100 mx-auto dark:bg-yellow-900"
            aria-hidden="true"
          >
            <svg
              className="h-12 w-12 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold text-gray-800 dark:text-gray-100">
            Đang xử lý thanh toán
          </h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Giao dịch của bạn đang được xử lý. Vui lòng kiểm tra lại sau ít phút.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => refetch()}
              className="flex-1 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: '#ee4d2d' }}
            >
              Kiểm tra lại
            </button>
            <button
              type="button"
              onClick={() => navigate(path.orderList)}
              className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-600 dark:text-gray-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
            >
              Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading / polling state
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
        {/* Spinner */}
        <div className="mb-6 flex justify-center" aria-label="Đang xử lý" role="status">
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
          Đang xác nhận thanh toán
        </h1>
        <p className="mb-2 text-gray-500 dark:text-gray-400">
          Vui lòng chờ trong giây lát...
        </p>
        {provider && (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Nhà cung cấp: {provider.toUpperCase()}
          </p>
        )}
      </div>
    </div>
  )
}

export default PaymentReturn
