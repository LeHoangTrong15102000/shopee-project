import { motion } from 'framer-motion'
import { Link } from 'react-router'
import ImageWithFallback from 'src/components/ImageWithFallback'
import { ANIMATION_DURATION } from 'src/styles/animations/motion.config'
import { Order } from 'src/types/checkout.type'
import { formatCurrency } from 'src/utils/utils'
import {
  itemsContainerVariants,
  orderItemVariants,
  reducedMotionVariants,
  sectionVariants
} from '../orderDetail.constants'

interface OrderDetailItemsProps {
  order: Order
  shouldReduceMotion: boolean | null
}

export default function OrderDetailItems({ order, shouldReduceMotion }: OrderDetailItemsProps) {
  const containerVariants = shouldReduceMotion ? reducedMotionVariants : itemsContainerVariants
  const itemVariants = shouldReduceMotion ? reducedMotionVariants : orderItemVariants

  return (
    <motion.div
      variants={shouldReduceMotion ? reducedMotionVariants : sectionVariants}
      whileHover={shouldReduceMotion ? {} : { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
      transition={{ duration: ANIMATION_DURATION.fast }}
      className='relative overflow-hidden rounded-xl bg-white p-5 shadow-xs transition-all duration-200 dark:border dark:border-slate-700 dark:bg-slate-800'
    >
      <div className='absolute top-0 right-0 left-0 h-0.5 bg-linear-to-r from-orange via-amber-500 to-yellow-400' />
      <h2 className='mb-4 flex items-center gap-2.5 font-semibold text-gray-900 dark:text-gray-100'>
        <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-orange to-amber-600 shadow-md shadow-orange-200/40 dark:shadow-orange-800/30'>
          <svg className='h-4 w-4 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z'
            />
          </svg>
        </span>
        Sản phẩm
        <span className='ml-auto text-xs font-normal text-gray-400 dark:text-gray-500'>
          {order.items.length} sản phẩm
        </span>
      </h2>
      <motion.div variants={containerVariants} initial='hidden' animate='visible' className='space-y-3'>
        {order.items.map((item, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { scale: 1.01, boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}
            transition={{ duration: ANIMATION_DURATION.fast }}
            className='flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 transition-all duration-200 hover:border-orange/20 sm:gap-4 sm:p-3 dark:border-slate-600/50 dark:bg-slate-700/30 dark:hover:border-orange-500/20'
          >
            <div className='h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-xs sm:h-24 sm:w-24 sm:rounded-xl dark:border-slate-600'>
              <ImageWithFallback
                src={item.product?.image || ''}
                alt={item.product?.name || 'Product'}
                className='h-full w-full object-cover'
              />
            </div>
            <div className='flex min-w-0 flex-1 flex-col justify-between'>
              <div>
                <Link
                  to={`/${item.product?.name?.replace(/\s+/g, '-')}-i-${item.product?._id}`}
                  className='line-clamp-2 text-sm leading-snug font-medium text-gray-900 transition-colors duration-200 hover:text-orange sm:text-base dark:text-gray-100 dark:hover:text-orange-400'
                >
                  {item.product?.name || 'Sản phẩm'}
                </Link>
                <p className='mt-1 flex items-center gap-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
                  <svg
                    className='h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25'
                    />
                  </svg>
                  x{item.buyCount}
                </p>
              </div>
              <div className='mt-1.5 flex flex-col gap-1 sm:mt-2 sm:flex-row sm:items-center sm:gap-2'>
                <div className='flex items-center gap-2'>
                  {item.priceBeforeDiscount > item.price && (
                    <span className='text-xs text-gray-400 line-through dark:text-gray-500'>
                      ₫{formatCurrency(item.priceBeforeDiscount)}
                    </span>
                  )}
                  <span className='text-sm font-semibold text-orange sm:text-base dark:text-orange-400'>
                    ₫{formatCurrency(item.price)}
                  </span>
                </div>
                <div className='flex items-baseline gap-1.5 sm:ml-auto'>
                  <span className='text-xs text-gray-400 dark:text-gray-500'>Thành tiền:</span>
                  <span className='text-sm font-bold text-orange sm:text-base dark:text-orange-400'>
                    ₫{formatCurrency(item.price * item.buyCount)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
