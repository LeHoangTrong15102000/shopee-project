import { memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ShippingMethod } from 'src/types/checkout.type'
import checkoutApi from 'src/apis/checkout.api'
import { formatCurrency } from 'src/utils/utils'
import { getEstimatedDeliveryDate } from 'src/utils/date'
import { ShippingIcon } from 'src/components/Icons'

interface ShippingMethodSelectorProps {
  selectedMethodId: string | null
  onSelect: (method: ShippingMethod) => void
}

const ShippingMethodSelector = memo(function ShippingMethodSelector({
  selectedMethodId,
  onSelect
}: ShippingMethodSelectorProps) {
  const { data: methodsData, isLoading } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const res = await checkoutApi.getShippingMethods()
      return res.data.data
    }
  })

  const methods = methodsData || []

  if (isLoading) {
    return (
      <div className='animate-pulse space-y-3'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='h-20 rounded-lg bg-gray-200 dark:bg-slate-700' />
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {methods.map((method) => (
        <motion.div
          key={method._id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`cursor-pointer rounded-lg border-2 bg-white p-3 transition-all md:p-4 dark:bg-slate-800 ${
            selectedMethodId === method._id
              ? 'border-orange'
              : 'border-gray-200 hover:border-gray-300 dark:border-slate-600 dark:hover:border-slate-500'
          }`}
          onClick={() => onSelect(method)}
          role='button'
          tabIndex={0}
          aria-pressed={selectedMethodId === method._id}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(method)}
        >
          <div className='flex items-center gap-2.5 sm:gap-4'>
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selectedMethodId === method._id ? 'border-orange' : 'border-gray-300 dark:border-slate-500'
              }`}
            >
              {selectedMethodId === method._id && <div className='h-3 w-3 rounded-full bg-orange' />}
            </div>

            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1.5 text-orange sm:gap-2'>
                <ShippingIcon type={method.icon} className='h-5 w-5 shrink-0 sm:h-6 sm:w-6' />
                <span className='text-sm font-medium text-gray-900 sm:text-base dark:text-gray-100'>{method.name}</span>
              </div>
              <p className='mt-0.5 line-clamp-2 text-xs text-gray-500 sm:mt-1 sm:text-sm dark:text-gray-400'>
                {method.description}
              </p>
              <p className='mt-0.5 text-xs text-gray-600 sm:mt-1 sm:text-sm dark:text-gray-400'>
                Thời gian: <span className='font-medium'>{method.estimatedDays}</span>
              </p>
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='mt-1 flex items-center gap-1 text-xs font-medium text-green-600 sm:mt-1.5 sm:gap-1.5 sm:text-sm dark:text-green-400'
              >
                <svg
                  className='h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
                <span className='truncate'>Dự kiến giao: {getEstimatedDeliveryDate(method.estimatedDays)}</span>
              </motion.p>
            </div>

            <div className='shrink-0 text-right'>
              <span className='text-sm font-semibold text-orange sm:text-lg'>₫{formatCurrency(method.price)}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
})

export default ShippingMethodSelector
