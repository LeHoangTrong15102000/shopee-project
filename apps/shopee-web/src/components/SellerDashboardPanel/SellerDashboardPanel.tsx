import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import useSellerDashboard from 'src/hooks/useSellerDashboard'

interface SellerDashboardPanelProps {
  className?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export default function SellerDashboardPanel({ className }: SellerDashboardPanelProps) {
  const { t } = useTranslation('user')
  const { metrics, orderNotifications, qaNotifications, isActive } = useSellerDashboard()
  if (!isActive) {
    return null
  }

  return (
    <div className={classNames('rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800', className)}>
      <h3 className='mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100'>📊 {t('seller.dashboardTitle')}</h3>

      {/* Metrics Cards */}
      <div className='mb-4 grid grid-cols-2 gap-3'>
        <div className='rounded-lg bg-orange-50 p-3 text-center dark:bg-orange-900/20'>
          <p className='text-2xl font-bold text-[#ee4d2d]'>{metrics.today_orders}</p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>{t('seller.todayOrders')}</p>
        </div>
        <div className='rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20'>
          <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
            {formatCurrency(metrics.today_revenue)}
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>{t('seller.todayRevenue')}</p>
        </div>
        <div className='rounded-lg bg-yellow-50 p-3 text-center dark:bg-yellow-900/20'>
          <p className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>{metrics.pending_orders}</p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>{t('seller.pendingOrders')}</p>
        </div>
        <div className='rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20'>
          <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{metrics.pending_qa}</p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>{t('seller.pendingQA')}</p>
        </div>
      </div>

      {/* Order Notifications */}
      {orderNotifications.length > 0 && (
        <div className='mb-3'>
          <h4 className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-200'>🔔 {t('seller.newOrders')}</h4>
          <div className='max-h-40 space-y-1 overflow-y-auto'>
            {orderNotifications.slice(0, 10).map((notif, index) => (
              <div
                key={`${notif.order_id}-${index}`}
                className='flex items-center gap-2 rounded-sm bg-gray-50 px-2 py-1.5 text-xs dark:bg-slate-700'
              >
                <span>📦</span>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-gray-700 dark:text-gray-200'>{notif.product_names.join(', ')}</p>
                  <p className='text-gray-400 dark:text-gray-500'>{formatCurrency(notif.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Q&A Notifications */}
      {qaNotifications.length > 0 && (
        <div>
          <h4 className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-200'>❓ {t('seller.newQuestions')}</h4>
          <div className='max-h-40 space-y-1 overflow-y-auto'>
            {qaNotifications.slice(0, 10).map((notif, index) => (
              <div
                key={`${notif.product_name}-${index}`}
                className='flex items-center gap-2 rounded-sm bg-gray-50 px-2 py-1.5 text-xs dark:bg-slate-700'
              >
                <span>💬</span>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-gray-700 dark:text-gray-200'>
                    {notif.user_name}: {notif.question_preview}
                  </p>
                  <Link
                    to={`/${notif.product_name.replace(/\s+/g, '-')}-i-${notif.product_id}`}
                    className='block truncate text-blue-500 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300'
                    onClick={(e) => e.stopPropagation()}
                  >
                    {notif.product_name} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
