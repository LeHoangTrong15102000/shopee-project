import classNames from 'classnames'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'
import LiveOrderTracker from 'src/components/LiveOrderTracker'
import path from 'src/constant/path'
import { purchasesStatus } from 'src/constant/purchase'
import { useOptimisticAddToCart } from 'src/hooks/optimistic'
import { staggerItem, buttonHover, ANIMATION_DURATION } from 'src/styles/animations'
import { Purchase } from 'src/types/purchases.type'
import { formatCurrency, generateNameId } from 'src/utils/utils'
import Button from 'src/components/Button'

interface PurchaseItemProps {
  purchase: Purchase
  reducedMotion: boolean
  isExpanded: boolean
  onToggleTracking: (orderId: string) => void
  onReviewClick: (purchase: Purchase) => void
}

interface ReorderButtonProps {
  purchase: Purchase
  reducedMotion: boolean
}

const ReorderButton = ({ purchase, reducedMotion }: ReorderButtonProps) => {
  const addToCartMutation = useOptimisticAddToCart()

  const handleReorder = () => {
    addToCartMutation.mutate({
      product_id: purchase.product._id,
      buy_count: purchase.buy_count
    })
  }

  return (
    <motion.div
      whileHover={reducedMotion || addToCartMutation.isPending ? undefined : buttonHover.whileHover}
      whileTap={reducedMotion || addToCartMutation.isPending ? undefined : buttonHover.whileTap}
      transition={buttonHover.transition}
    >
      <Button
        animated={false}
        type='button'
        onClick={handleReorder}
        disabled={addToCartMutation.isPending}
        aria-label='Mua lại sản phẩm này'
        aria-busy={addToCartMutation.isPending}
        className={classNames(
          'flex items-center gap-1.5 rounded-sm px-4 py-2 text-sm font-medium text-white transition-colors',
          'bg-[#ee4d2d] hover:bg-[#d73211]',
          {
            'cursor-not-allowed opacity-70': addToCartMutation.isPending
          }
        )}
      >
        {addToCartMutation.isPending ? (
          <svg
            aria-hidden='true'
            className='h-4 w-4 animate-spin fill-white text-gray-200'
            viewBox='0 0 100 101'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
              fill='currentColor'
            />
            <path
              d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
              fill='currentFill'
            />
          </svg>
        ) : (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-4 w-4'
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z'
            />
          </svg>
        )}
        <span>Mua lại</span>
      </Button>
    </motion.div>
  )
}

const isActiveOrder = (orderStatus: number) => {
  return (
    orderStatus === purchasesStatus.waitForConfirmation ||
    orderStatus === purchasesStatus.waitForGetting ||
    orderStatus === purchasesStatus.inProgress
  )
}

const PurchaseItem = ({ purchase, reducedMotion, isExpanded, onToggleTracking, onReviewClick }: PurchaseItemProps) => {
  return (
    <motion.div key={purchase._id} variants={reducedMotion ? undefined : staggerItem}>
      <div className='mt-4 rounded-lg border border-gray-200 bg-white p-6 text-gray-800 shadow-xs dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200'>
        {/* Link dẫn dến sản phẩm */}
        <Link
          to={`${path.home}${generateNameId({ name: purchase.product.name, id: purchase.product._id })}`}
          className='flex flex-col sm:flex-row'
        >
          <div className='shrink-0'>
            <img
              src={purchase.product.image}
              className='h-20 w-20 border border-gray-200 object-cover dark:border-slate-600'
              alt={purchase.product.name}
            />
          </div>
          <div className='ml-4 grow overflow-hidden'>
            <div className='truncate dark:text-gray-100'>{purchase.product.name}</div>
            <div className='mt-3 dark:text-gray-300'>x{purchase.buy_count}</div>
          </div>
          {/* giá tiền */}
          <div className='mt-2 flex shrink-0 items-center sm:mt-0 sm:ml-3'>
            <span className='truncate text-black/25 line-through dark:text-gray-500'>
              ₫{formatCurrency(purchase.product.price_before_discount)}
            </span>
            <span className='ml-1 truncate text-orange dark:text-orange-400'>
              ₫{formatCurrency(purchase.product.price)}
            </span>
          </div>
        </Link>
        {/* Status và Review Actions */}
        <div className='mt-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center'>
          <div className='flex items-center'>
            {/* Hoàn thành - Delivered */}
            {purchase.status === purchasesStatus.delivered && (
              <span className='inline-flex items-center rounded-full bg-linear-to-r from-green-50 to-emerald-50 px-3 py-1.5 text-sm font-medium text-green-600 shadow-xs ring-1 ring-green-200/50'>
                Hoàn thành
              </span>
            )}
            {/* Chờ xác nhận - Waiting for confirmation */}
            {purchase.status === purchasesStatus.waitForConfirmation && (
              <span
                className={classNames(
                  'inline-flex items-center rounded-full bg-linear-to-r from-orange-50 to-amber-50 px-3 py-1.5 text-sm font-medium text-[#ee4d2d] shadow-xs ring-1 ring-orange-200/50',
                  { 'animate-[status-pulse_2s_ease-in-out_infinite]': !reducedMotion }
                )}
              >
                Chờ xác nhận
              </span>
            )}
            {/* Chờ lấy hàng - Waiting for pickup */}
            {purchase.status === purchasesStatus.waitForGetting && (
              <span
                className={classNames(
                  'inline-flex items-center rounded-full bg-linear-to-r from-blue-50 to-sky-50 px-3 py-1.5 text-sm font-medium text-blue-600 shadow-xs ring-1 ring-blue-200/50',
                  { 'animate-[status-pulse-blue_2s_ease-in-out_infinite]': !reducedMotion }
                )}
              >
                Chờ lấy hàng
              </span>
            )}
            {/* Đang giao - In transit */}
            {purchase.status === purchasesStatus.inProgress && (
              <span
                className={classNames(
                  'inline-flex items-center rounded-full bg-linear-to-r from-orange-50 to-amber-50 px-3 py-1.5 text-sm font-medium text-[#ee4d2d] shadow-xs ring-1 ring-orange-200/50',
                  { 'animate-[status-pulse_2s_ease-in-out_infinite]': !reducedMotion }
                )}
              >
                Đang giao
              </span>
            )}
            {/* Đã hủy - Cancelled */}
            {purchase.status === purchasesStatus.cancelled && (
              <span className='inline-flex items-center rounded-full bg-linear-to-r from-red-50 to-rose-50 px-3 py-1.5 text-sm font-medium text-red-600 shadow-xs ring-1 ring-red-200/50'>
                Đã hủy
              </span>
            )}
          </div>

          <div className='flex flex-wrap items-center gap-2 sm:space-x-3'>
            {/* Order Tracking Button - only for active orders */}
            {isActiveOrder(purchase.status) && (
              <Button
                animated={false}
                type='button'
                onClick={() => onToggleTracking(purchase._id)}
                className='flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-orange shadow-md transition-colors hover:border-orange/30 dark:border-slate-600 dark:bg-slate-700 dark:text-orange-400 dark:hover:border-orange-400/30'
              >
                {/* Truck icon - filled with primary color */}
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-4 w-4'>
                  <path d='M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 116 0h3a.75.75 0 00.75-.75V15z' />
                  <path d='M8.25 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM15.75 6.75a.75.75 0 00-.75.75v7.5h7.5v-1.5a3 3 0 00-3-3h-.375V7.5a.75.75 0 00-.75-.75h-2.625z' />
                  <path d='M21.75 18h.75a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75h-.75v3zM19.5 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z' />
                </svg>
                <span>Theo dõi đơn hàng</span>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                  className={classNames('h-3 w-3 transition-transform', {
                    'rotate-180': isExpanded
                  })}
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
                </svg>
              </Button>
            )}
            {purchase.status === purchasesStatus.delivered && (
              <ReorderButton purchase={purchase} reducedMotion={reducedMotion} />
            )}
            {purchase.status === purchasesStatus.delivered && (
              <Button
                animated={false}
                onClick={() => onReviewClick(purchase)}
                className='rounded-sm border border-[#ee4d2d] px-4 py-2 text-[#ee4d2d] transition-colors hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-400/10'
              >
                Đánh Giá Sản Phẩm
              </Button>
            )}
            <Button
              animated={false}
              className='rounded-sm border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
            >
              Xem Đánh Giá Shop
            </Button>
          </div>
        </div>

        {/* Expandable Order Tracking Timeline */}
        <AnimatePresence>
          {isActiveOrder(purchase.status) && isExpanded && (
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, height: 0 }}
              animate={reducedMotion ? undefined : { opacity: 1, height: 'auto' }}
              exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: ANIMATION_DURATION.normal }}
              className='overflow-hidden'
            >
              <div className='mt-4 border-t border-gray-100 pt-4 dark:border-slate-600'>
                <LiveOrderTracker
                  orderId={purchase._id}
                  initialStatus={purchase.status}
                  className='bg-gray-50 dark:bg-slate-900'
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thành tiền */}
      <div className='flex items-center justify-end rounded-sm bg-neutral-50 p-6 dark:bg-slate-900'>
        <div className='flex items-center'>
          <span className='mr-1'>
            <svg width={16} height={17} viewBox='0 0 253 263' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M126.5 0.389801C126.5 0.389801 82.61 27.8998 5.75 26.8598C5.08763 26.8507 4.43006 26.9733 3.81548 27.2205C3.20091 27.4677 2.64159 27.8346 2.17 28.2998C1.69998 28.7657 1.32713 29.3203 1.07307 29.9314C0.819019 30.5425 0.688805 31.198 0.689995 31.8598V106.97C0.687073 131.07 6.77532 154.78 18.3892 175.898C30.003 197.015 46.7657 214.855 67.12 227.76L118.47 260.28C120.872 261.802 123.657 262.61 126.5 262.61C129.343 262.61 132.128 261.802 134.53 260.28L185.88 227.73C206.234 214.825 222.997 196.985 234.611 175.868C246.225 154.75 252.313 131.04 252.31 106.94V31.8598C252.31 31.1973 252.178 30.5414 251.922 29.9303C251.667 29.3191 251.292 28.7649 250.82 28.2998C250.35 27.8358 249.792 27.4696 249.179 27.2225C248.566 26.9753 247.911 26.852 247.25 26.8598C170.39 27.8998 126.5 0.389801 126.5 0.389801Z'
                fill='#ee4d2d'
              />
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M207.7 149.66L119.61 107.03C116.386 105.472 113.914 102.697 112.736 99.3154C111.558 95.9342 111.772 92.2235 113.33 88.9998C114.888 85.7761 117.663 83.3034 121.044 82.1257C124.426 80.948 128.136 81.1617 131.36 82.7198L215.43 123.38C215.7 120.38 215.85 117.38 215.85 114.31V61.0298C215.848 60.5592 215.753 60.0936 215.57 59.6598C215.393 59.2232 215.128 58.8281 214.79 58.4998C214.457 58.1705 214.063 57.909 213.63 57.7298C213.194 57.5576 212.729 57.4727 212.26 57.4798C157.69 58.2298 126.5 38.6798 126.5 38.6798C126.5 38.6798 95.31 58.2298 40.71 57.4798C40.2401 57.4732 39.7735 57.5602 39.3376 57.7357C38.9017 57.9113 38.5051 58.1719 38.1709 58.5023C37.8367 58.8328 37.5717 59.2264 37.3913 59.6604C37.2108 60.0943 37.1186 60.5599 37.12 61.0298V108.03L118.84 147.57C121.591 148.902 123.808 151.128 125.129 153.884C126.45 156.64 126.797 159.762 126.113 162.741C125.429 165.72 123.755 168.378 121.363 170.282C118.972 172.185 116.006 173.221 112.95 173.22C110.919 173.221 108.915 172.76 107.09 171.87L40.24 139.48C46.6407 164.573 62.3785 186.277 84.24 200.16L124.49 225.7C125.061 226.053 125.719 226.24 126.39 226.24C127.061 226.24 127.719 226.053 128.29 225.7L168.57 200.16C187.187 188.399 201.464 170.892 209.24 150.29C208.715 150.11 208.2 149.9 207.7 149.66Z'
                fill='#fff'
              />
            </svg>
          </span>
          <span className='text-md dark:text-gray-200'>Thành tiền:</span>
          <span className='ml-2 text-[25px] text-orange dark:text-orange-400'>
            ₫{formatCurrency(purchase.product.price * purchase.buy_count)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default PurchaseItem
