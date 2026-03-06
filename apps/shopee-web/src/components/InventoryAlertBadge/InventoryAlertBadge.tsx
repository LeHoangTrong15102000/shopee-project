import classNames from 'classnames'
import { InventoryAlertPayload } from 'src/types/socket.types'
import Button from 'src/components/Button'

interface InventoryAlertBadgeProps {
  alerts: InventoryAlertPayload[]
  unreadCount: number
  onClear?: () => void
  className?: string
}

export default function InventoryAlertBadge({ alerts, unreadCount, onClear, className }: InventoryAlertBadgeProps) {
  if (unreadCount === 0) return null

  return (
    <div className={classNames('relative', className)}>
      {/* Badge count */}
      <div className='flex items-center gap-2'>
        <span className='relative inline-flex'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5 text-orange sm:h-6 sm:w-6'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
            />
          </svg>
          {unreadCount > 0 && (
            <span className='absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white sm:h-5 sm:w-5 sm:text-xs'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      </div>

      {/* Alert dropdown (shown on hover/click) */}
      {alerts.length > 0 && (
        <div className='absolute top-full right-0 z-50 mt-2 w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white shadow-lg sm:w-80 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50'>
          <div className='flex items-center justify-between border-b border-gray-100 px-3 py-2 sm:px-4 dark:border-slate-700'>
            <span className='text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-200'>Cảnh báo tồn kho</span>
            {onClear && (
              <Button
                animated={false}
                onClick={onClear}
                className='text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
              >
                Xóa tất cả
              </Button>
            )}
          </div>
          <div className='max-h-60 overflow-y-auto'>
            {alerts.slice(0, 10).map((alert, index) => (
              <div
                key={`${alert.product_id}-${index}`}
                className={classNames(
                  'border-b border-gray-50 px-3 py-2 last:border-b-0 sm:px-4 sm:py-3 dark:border-slate-700',
                  alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/30' : 'bg-yellow-50 dark:bg-yellow-900/30'
                )}
              >
                <div className='flex items-start gap-2'>
                  <span className='text-base'>{alert.severity === 'critical' ? '🚨' : '⚠️'}</span>
                  <div>
                    <p className='text-sm font-medium text-gray-800 dark:text-gray-100'>{alert.product_name}</p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      {alert.current_quantity === 0 ? 'Đã hết hàng!' : `Chỉ còn ${alert.current_quantity} sản phẩm`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
