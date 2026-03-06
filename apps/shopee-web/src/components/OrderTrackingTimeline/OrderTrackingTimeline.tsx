import classNames from 'classnames'
import { OrderStatus, getStatusLabel } from 'src/config/orderStatus'
import { OrderTracking, getCarrierDisplayName } from 'src/types/orderTracking.type'

interface OrderTrackingTimelineProps {
  tracking: OrderTracking
  className?: string
}

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipping', 'delivered']

// Unique SVG icon per status
function StatusIcon({ status, className }: { status: string; className?: string }) {
  switch (status) {
    case 'pending':
      return (
        <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
      )
    case 'confirmed':
      return (
        <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      )
    case 'processing':
      return (
        <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'
          />
        </svg>
      )
    case 'shipping':
      return (
        <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
          />
        </svg>
      )
    case 'delivered':
      return (
        <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z'
          />
        </svg>
      )
    case 'cancelled':
      return (
        <svg className={className} fill='currentColor' viewBox='0 0 20 20'>
          <path
            fillRule='evenodd'
            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
      )
    case 'returned':
      return (
        <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3' />
        </svg>
      )
    default:
      return (
        <svg className={className} fill='currentColor' viewBox='0 0 20 20'>
          <path
            fillRule='evenodd'
            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
            clipRule='evenodd'
          />
        </svg>
      )
  }
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusIndex(status: OrderStatus): number {
  return STATUS_ORDER.indexOf(status)
}

export default function OrderTrackingTimeline({ tracking, className }: OrderTrackingTimelineProps) {
  const currentStatusIndex = getStatusIndex(tracking.status)
  const isCancelled = tracking.status === 'cancelled'
  const isReturned = tracking.status === 'returned'

  // Filter timeline: only show events up to and including the current status
  const visibleTimeline = tracking.timeline.filter((event) => {
    const eventIndex = getStatusIndex(event.status as OrderStatus)
    // Always show cancelled/returned events if that's the current status
    if (event.status === 'cancelled' || event.status === 'returned') {
      return isCancelled || isReturned
    }
    // Only show events whose status index <= current status index
    return eventIndex <= currentStatusIndex
  })

  return (
    <div
      className={classNames(
        'overflow-hidden rounded-xl bg-white shadow-xs dark:border dark:border-slate-700 dark:bg-slate-800',
        className
      )}
    >
      {/* Carrier Info Card */}
      <div className='border-b border-gray-100 bg-linear-to-r from-gray-50 via-white to-gray-50/50 p-4 md:p-5 dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800'>
        <div className='flex items-center gap-3'>
          <div className='flex-1'>
            <h3 className='font-medium text-gray-900 dark:text-gray-100'>{getCarrierDisplayName(tracking.carrier)}</h3>
            <p className='text-sm text-gray-500 dark:text-gray-300'>
              Mã vận đơn:{' '}
              <span className='rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-[#26aa99] dark:bg-teal-950/30 dark:text-[#26aa99]'>
                {tracking.tracking_number}
              </span>
            </p>
          </div>
        </div>

        {/* Estimated Delivery */}
        {!isCancelled && !isReturned && tracking.status !== 'delivered' && (
          <div className='mt-3 rounded-lg border border-teal-100 bg-teal-50 p-3 dark:border-teal-800/30 dark:bg-teal-900/20'>
            <div className='flex items-center gap-2'>
              <svg
                className='h-4 w-4 shrink-0 text-[#26aa99] dark:text-[#26aa99]'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
                />
              </svg>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                Dự kiến giao hàng:{' '}
                <span className='font-semibold text-[#26aa99] dark:text-[#26aa99]'>
                  {formatDateTime(tracking.estimated_delivery)}
                </span>
              </p>
            </div>
          </div>
        )}

        {tracking.status === 'delivered' && (
          <div className='mt-3 rounded-lg bg-green-50 p-3 dark:bg-green-900/20'>
            <p className='text-sm font-medium text-green-700 dark:text-green-400'>✓ Đơn hàng đã được giao thành công</p>
          </div>
        )}

        {isCancelled && (
          <div className='mt-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20'>
            <p className='text-sm font-medium text-red-700 dark:text-red-400'>✕ Đơn hàng đã bị hủy</p>
          </div>
        )}

        {isReturned && (
          <div className='mt-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20'>
            <p className='text-sm font-medium text-red-700 dark:text-red-400'>↩ Đơn hàng đã được trả lại</p>
          </div>
        )}
      </div>

      {/* Timeline - only shows events up to current status */}
      <div className='p-3 md:p-4'>
        <h4 className='mb-4 font-medium text-gray-900 dark:text-gray-100'>Trạng thái đơn hàng</h4>

        <div className='relative'>
          {visibleTimeline.map((event, index) => {
            const isLast = index === visibleTimeline.length - 1
            const isCurrent = event.status === tracking.status
            const eventStatusIndex = getStatusIndex(event.status as OrderStatus)
            const isPassed = eventStatusIndex < currentStatusIndex
            const isError = event.status === 'cancelled' || event.status === 'returned'

            return (
              <div key={`${event.timestamp}-${index}`} className='relative flex gap-3 md:gap-4'>
                {/* Timeline Line */}
                {!isLast && (
                  <div
                    className={classNames('absolute top-6 left-[11px] h-full w-0.5 -translate-x-1/2', {
                      'bg-[#26aa99] dark:bg-[#26aa99]': isCurrent && !isError,
                      'bg-gray-200 dark:bg-slate-600': !isCurrent && !isError,
                      'bg-red-500 dark:bg-red-400': isError
                    })}
                  />
                )}

                {/* Timeline Node */}
                <div className='relative z-10 shrink-0'>
                  <div
                    className={classNames('flex h-5 w-5 items-center justify-center rounded-full md:h-6 md:w-6', {
                      'bg-gray-300 dark:bg-slate-500': isPassed && !isError,
                      'bg-[#26aa99] shadow-md shadow-[#26aa99]/30 dark:bg-[#26aa99]': isCurrent && !isError,
                      'bg-gray-200 dark:bg-slate-600': !isPassed && !isCurrent && !isError,
                      'bg-red-500 dark:bg-red-500': isError
                    })}
                  >
                    {isPassed && !isError && <StatusIcon status={event.status} className='h-3 w-3 text-white' />}
                    {isCurrent && !isError && <StatusIcon status={event.status} className='h-3 w-3 text-white' />}
                    {isError && <StatusIcon status={event.status} className='h-3 w-3 text-white' />}
                  </div>
                </div>

                {/* Event Content */}
                <div className={classNames('flex-1 pb-6', { 'pb-0': isLast })}>
                  <div
                    className={classNames('font-medium', {
                      'text-gray-700 dark:text-gray-300': isPassed && !isError,
                      'text-[#26aa99] dark:text-[#26aa99]': isCurrent && !isError,
                      'text-gray-400 dark:text-slate-400': !isPassed && !isCurrent && !isError,
                      'text-red-600 dark:text-red-400': isError
                    })}
                  >
                    {getStatusLabel(event.status as OrderStatus)}
                  </div>
                  <p className='mt-1 text-xs text-gray-600 md:text-sm dark:text-gray-300'>{event.description}</p>
                  {event.location && (
                    <p className='mt-1.5 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300'>
                      <span className='inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-400 dark:bg-slate-500'>
                        <svg className='h-2.5 w-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fillRule='evenodd'
                            d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </span>
                      {event.location}
                    </p>
                  )}
                  <p className='mt-1 text-xs text-gray-500 dark:text-slate-400'>{formatDateTime(event.timestamp)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Last Updated */}
      <div className='px-3 pb-3 md:px-4 md:pb-4'>
        <p className='text-right text-xs text-gray-500 dark:text-slate-400'>
          Cập nhật lần cuối: {formatDateTime(tracking.updatedAt)}
        </p>
      </div>
    </div>
  )
}
