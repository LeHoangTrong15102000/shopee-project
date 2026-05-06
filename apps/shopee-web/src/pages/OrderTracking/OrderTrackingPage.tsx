import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import orderTrackingApi from 'src/apis/orderTracking.api'
import OrderTrackingTimeline from 'src/components/OrderTrackingTimeline'
import SEO from 'src/components/SEO'

const OrderTrackingPage = () => {
  const { number } = useParams<{ number: string }>()
  const [inputValue, setInputValue] = useState(number ?? '')
  const [submittedNumber, setSubmittedNumber] = useState(number ?? '')

  // When URL param changes, update the submitted number
  useEffect(() => {
    if (number) {
      setInputValue(number)
      setSubmittedNumber(number)
    }
  }, [number])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['orderTracking', submittedNumber],
    queryFn: () => orderTrackingApi.getTrackingByNumber(submittedNumber),
    enabled: Boolean(submittedNumber),
    retry: 1,
  })

  const tracking = data?.data?.data

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (trimmed) {
      setSubmittedNumber(trimmed)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900'>
      <SEO
        title='Order Tracking'
        description='Track your order status in real time'
      />

      <div className='container py-8'>
        <h1 className='mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100'>
          Track Your Order
        </h1>

        {/* Search form */}
        <form onSubmit={handleSubmit} className='mb-8'>
          <div className='flex gap-2'>
            <input
              type='text'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder='Enter tracking number (e.g. TRK123456)'
              className='flex-1 rounded-sm border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-400'
              aria-label='Tracking number'
            />
            <button
              type='submit'
              disabled={!inputValue.trim() || isLoading}
              className='rounded-sm bg-orange px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange/90 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isLoading ? 'Tracking...' : 'Track'}
            </button>
          </div>
        </form>

        {/* Loading state */}
        {isLoading && (
          <div className='flex items-center justify-center py-16'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent' />
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className='rounded-sm bg-white p-8 text-center shadow-sm dark:bg-slate-800'>
            <svg
              className='mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={1.5}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <p className='text-base font-medium text-gray-700 dark:text-gray-300'>
              Tracking information not found
            </p>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {(error as Error)?.message || `No tracking info found for "${submittedNumber}"`}
            </p>
          </div>
        )}

        {/* Empty state / no submission yet */}
        {!submittedNumber && !isLoading && (
          <div className='rounded-sm bg-white p-12 text-center shadow-sm dark:bg-slate-800'>
            <svg
              className='mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600'
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
            <p className='text-gray-500 dark:text-gray-400'>
              Enter a tracking number above to see your shipment status
            </p>
          </div>
        )}

        {/* Tracking result */}
        {tracking && !isLoading && (
          <div className='space-y-4'>
            {/* Summary card */}
            <div className='rounded-sm bg-white p-4 shadow-sm dark:bg-slate-800'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>Tracking number</span>
                  <p className='font-mono text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {tracking.tracking_number}
                  </p>
                </div>
                <div>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>Carrier</span>
                  <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {tracking.carrier}
                  </p>
                </div>
                {tracking.estimated_delivery && (
                  <div>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>Estimated delivery</span>
                    <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                      {new Date(tracking.estimated_delivery).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}
                <div>
                  <span className='inline-flex items-center rounded-full bg-orange/10 px-3 py-1 text-xs font-medium capitalize text-orange dark:bg-orange-900/30 dark:text-orange-400'>
                    {tracking.status}
                  </span>
                </div>
              </div>

              {/* Shipping address */}
              {tracking.shipping_address && (
                <div className='mt-3 border-t border-gray-100 pt-3 dark:border-slate-700'>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>Delivery to</span>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {tracking.shipping_address.name} &bull; {tracking.shipping_address.phone}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {tracking.shipping_address.address}, {tracking.shipping_address.ward},{' '}
                    {tracking.shipping_address.district}, {tracking.shipping_address.province}
                  </p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <OrderTrackingTimeline tracking={tracking} />
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderTrackingPage
