import { motion } from 'framer-motion'
import { ANIMATION_DURATION } from 'src/styles/animations/motion.config'
import { Order } from 'src/types/checkout.type'
import { formatCurrency } from 'src/utils/utils'
import { reducedMotionVariants, sectionVariants } from '../orderDetail.constants'

interface OrderSummarySectionProps {
  order: Order
  shouldReduceMotion: boolean | null
}

export default function OrderSummarySection({ order, shouldReduceMotion }: OrderSummarySectionProps) {
  const sectionItemVariants = shouldReduceMotion ? reducedMotionVariants : sectionVariants

  return (
    <motion.div
      variants={sectionItemVariants}
      whileHover={shouldReduceMotion ? {} : { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
      transition={{ duration: ANIMATION_DURATION.fast }}
      className='relative overflow-hidden rounded-xl bg-white p-5 shadow-xs transition-all duration-200 dark:border dark:border-slate-700 dark:bg-slate-800'
    >
      <div className='absolute top-0 right-0 left-0 h-0.5 bg-linear-to-r from-emerald-400 via-teal-500 to-cyan-500' />
      <h2 className='mb-4 flex items-center gap-2.5 font-semibold text-gray-900 dark:text-gray-100'>
        <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200/40 dark:shadow-emerald-800/30'>
          <svg className='h-4 w-4 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z'
            />
          </svg>
        </span>
        Tổng cộng
      </h2>
      <div className='space-y-3 text-sm'>
        <div className='flex items-center justify-between'>
          <span className='text-gray-500 dark:text-gray-300'>Tạm tính</span>
          <span className='text-gray-700 dark:text-gray-200'>₫{formatCurrency(order.subtotal)}</span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-gray-500 dark:text-gray-300'>Phí vận chuyển</span>
          <span className='text-gray-700 dark:text-gray-200'>₫{formatCurrency(order.shippingFee)}</span>
        </div>
        {order.discount > 0 && (
          <div className='flex items-center justify-between text-green-600 dark:text-green-400'>
            <span className='flex items-center gap-1'>
              <svg className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z'
                />
                <path strokeLinecap='round' strokeLinejoin='round' d='M6 6h.008v.008H6V6z' />
              </svg>
              Giảm giá voucher
            </span>
            <span className='font-medium'>-₫{formatCurrency(order.discount)}</span>
          </div>
        )}
        {order.coinsDiscount > 0 && (
          <div className='flex items-center justify-between text-amber-600 dark:text-amber-400'>
            <span className='flex items-center gap-1'>
              <svg className='h-3.5 w-3.5' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.798 7.45c.512-.67 1.135-.95 1.702-.95s1.19.28 1.702.95a.75.75 0 001.192-.91C12.637 5.55 11.5 5 10.5 5s-2.137.55-2.894 1.54A5.205 5.205 0 006.83 8H5.75a.75.75 0 000 1.5h.77a6.333 6.333 0 000 1h-.77a.75.75 0 000 1.5h1.08c.183.528.442 1.023.776 1.46.757.99 1.894 1.54 2.894 1.54s2.137-.55 2.894-1.54a.75.75 0 00-1.192-.91c-.512.67-1.135.95-1.702.95s-1.19-.28-1.702-.95a3.505 3.505 0 01-.343-.55h1.795a.75.75 0 000-1.5H8.026a4.835 4.835 0 010-1h2.224a.75.75 0 000-1.5H8.455c.098-.195.212-.38.343-.55z' />
              </svg>
              Giảm giá xu ({order.coinsUsed} xu)
            </span>
            <span className='font-medium'>-₫{formatCurrency(order.coinsDiscount)}</span>
          </div>
        )}
        <div className='border-t-2 border-dashed border-gray-200 pt-3 dark:border-slate-600'>
          <div className='flex items-center justify-between'>
            <span className='text-base font-semibold text-gray-900 dark:text-gray-100'>Tổng tiền</span>
            <span className='bg-linear-to-r from-orange to-rose-500 bg-clip-text text-2xl font-bold text-transparent'>
              ₫{formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
