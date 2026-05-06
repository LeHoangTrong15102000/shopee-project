import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import priceAlertApi, { PriceAlert } from 'src/apis/priceAlert.api'
import { formatCurrency } from 'src/utils/utils'
import SEO from 'src/components/SEO'

const PriceAlertsPage = () => {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['priceAlerts'],
    queryFn: () => priceAlertApi.getAlerts(),
    retry: 1,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => priceAlertApi.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceAlerts'] })
    },
  })

  const alerts: PriceAlert[] = data?.data?.data?.alerts ?? []

  return (
    <div className='rounded-sm bg-white px-4 pb-10 shadow md:px-7 md:pb-20 dark:bg-slate-800'>
      <SEO title='Price Alerts' description='Manage your product price alerts' />
      <div className='border-b border-b-gray-200 py-6 dark:border-b-slate-700'>
        <h1 className='text-lg font-medium capitalize text-gray-900 dark:text-gray-100'>Price Alerts</h1>
        <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
          Get notified when products drop below your target price
        </div>
      </div>

      {isLoading && (
        <div className='flex items-center justify-center py-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent' />
        </div>
      )}

      {isError && (
        <div className='flex flex-col items-center justify-center py-20 text-center'>
          <svg
            className='mb-4 h-16 w-16 text-gray-300 dark:text-gray-600'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={1.5}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
            />
          </svg>
          <p className='text-gray-500 dark:text-gray-400'>Unable to load price alerts</p>
          <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>Price alert service may not be available</p>
        </div>
      )}

      {!isLoading && !isError && alerts.length === 0 && (
        <div className='flex flex-col items-center justify-center py-20 text-center'>
          <svg
            className='mb-4 h-16 w-16 text-gray-300 dark:text-gray-600'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={1.5}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
            />
          </svg>
          <p className='text-gray-500 dark:text-gray-400'>No price alerts set</p>
          <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
            Add items to your wishlist and set a target price to get notified
          </p>
        </div>
      )}

      {!isLoading && !isError && alerts.length > 0 && (
        <ul className='divide-y divide-gray-100 dark:divide-slate-700'>
          {alerts.map((alert) => (
            <li key={alert._id} className='flex items-center gap-4 py-4'>
              {/* Product image */}
              <div className='h-16 w-16 shrink-0 overflow-hidden rounded border border-gray-200 dark:border-slate-600'>
                {alert.productImage ? (
                  <img
                    src={alert.productImage}
                    alt={alert.productName}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center bg-gray-100 dark:bg-slate-700'>
                    <svg
                      className='h-6 w-6 text-gray-400'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z'
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className='min-w-0 flex-1'>
                <Link
                  to={`/${alert.productId}`}
                  className='line-clamp-2 text-sm font-medium text-gray-900 hover:text-orange dark:text-gray-100 dark:hover:text-orange-400'
                >
                  {alert.productName}
                </Link>
                <div className='mt-1 flex items-center gap-3 text-xs'>
                  <span className='text-gray-500 dark:text-gray-400'>
                    Current: <span className='font-medium text-gray-700 dark:text-gray-300'>{formatCurrency(alert.currentPrice)}</span>
                  </span>
                  <span className='text-gray-400 dark:text-gray-500'>|</span>
                  <span className='text-gray-500 dark:text-gray-400'>
                    Target: <span className='font-medium text-orange dark:text-orange-400'>{formatCurrency(alert.targetPrice)}</span>
                  </span>
                </div>
                {alert.currentPrice <= alert.targetPrice && (
                  <div className='mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400'>
                    <svg className='h-3 w-3' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    Price target reached!
                  </div>
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={() => deleteMutation.mutate(alert._id)}
                disabled={deleteMutation.isPending}
                className='shrink-0 rounded p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-900/20'
                aria-label={`Remove price alert for ${alert.productName}`}
              >
                <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default PriceAlertsPage
