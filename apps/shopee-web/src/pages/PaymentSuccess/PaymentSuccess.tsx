import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import path from 'src/constant/path'

function PaymentSuccess() {
  const { t } = useTranslation('paymentSuccess')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')

  // Redirect guard: if no orderId, send to order list
  useEffect(() => {
    if (!orderId) {
      navigate(path.orderList, { replace: true })
    }
  }, [orderId, navigate])

  if (!orderId) {
    return null
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
        {/* Animated SVG checkmark */}
        <div className="mb-6 flex justify-center">
          <svg
            className="checkmark"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
            width="112"
            height="112"
            aria-hidden="true"
          >
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-2xl font-bold text-gray-800 dark:text-gray-100">
          {t('heading')}
        </h1>

        {/* Sub-text */}
        <p className="mb-5 text-gray-500 dark:text-gray-400">{t('subtext')}</p>

        {/* Order ID */}
        <div className="mb-8 rounded-lg bg-gray-50 px-4 py-3 dark:bg-slate-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">{t('orderIdLabel')} </span>
          <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100">
            {orderId}
          </span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(path.orderList)}
            className="flex-1 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            style={{ backgroundColor: '#ee4d2d' }}
          >
            {t('viewOrder')}
          </button>
          <button
            type="button"
            onClick={() => navigate(path.home)}
            className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange dark:border-slate-600 dark:text-gray-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
          >
            {t('continueShopping')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess
