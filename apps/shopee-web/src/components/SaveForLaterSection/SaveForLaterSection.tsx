import { memo, useState, useMemo } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { differenceInDays } from 'date-fns'
import { SavedItem } from 'src/hooks/useSaveForLater'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { formatCurrency, generateNameId } from 'src/utils/utils'
import ImageWithFallback from 'src/components/ImageWithFallback'
import path from 'src/constant/path'
import Button from 'src/components/Button'

interface SaveForLaterSectionProps {
  savedItems: SavedItem[]
  onMoveToCart: (item: SavedItem) => void
  onRemove: (productId: string) => void
  onClear: () => void
}

// Bookmark icon component
const BookmarkIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
    className={className}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z'
    />
  </svg>
)

// Calculate days since saved
const getDaysSinceSaved = (savedAt: string): string => {
  const days = differenceInDays(new Date(), new Date(savedAt))
  if (days === 0) return 'Hôm nay'
  if (days === 1) return 'Hôm qua'
  return `${days} ngày trước`
}

const SaveForLaterSection = memo(({ savedItems, onMoveToCart, onRemove, onClear }: SaveForLaterSectionProps) => {
  const prefersReducedMotion = useReducedMotion()
  const [isExpanded, setIsExpanded] = useState(savedItems.length > 0)

  // Animation variants
  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0, height: 0 },
      visible: {
        opacity: 1,
        height: 'auto',
        transition: {
          duration: prefersReducedMotion ? 0 : 0.3,
          staggerChildren: prefersReducedMotion ? 0 : 0.1
        }
      },
      exit: {
        opacity: 0,
        height: 0,
        transition: { duration: prefersReducedMotion ? 0 : 0.2 }
      }
    }),
    [prefersReducedMotion]
  )

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20, scale: 0.95 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: prefersReducedMotion ? 0 : 0.3,
          ease: 'easeOut'
        }
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        x: -20,
        transition: { duration: prefersReducedMotion ? 0 : 0.2 }
      }
    }),
    [prefersReducedMotion]
  )

  if (savedItems.length === 0) {
    return (
      <div className='mt-6 rounded-lg bg-white p-6 shadow-xs dark:bg-slate-800'>
        <div className='flex items-center gap-2 text-gray-500 dark:text-gray-400'>
          <BookmarkIcon className='h-5 w-5' />
          <span className='font-medium'>Đã lưu để mua sau</span>
        </div>
        <div className='flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500'>
          <BookmarkIcon className='mb-3 h-12 w-12 opacity-50' />
          <p>Chưa có sản phẩm nào được lưu</p>
        </div>
      </div>
    )
  }

  return (
    <div className='mt-6 rounded-lg bg-white p-4 shadow-xs dark:bg-slate-800'>
      {/* Header */}
      <div className='mb-4 flex items-center justify-between'>
        <Button
          animated={false}
          onClick={() => setIsExpanded(!isExpanded)}
          className='flex items-center gap-2 text-gray-700 transition-colors hover:text-[#ee4d2d] dark:text-gray-200'
        >
          <BookmarkIcon className='h-5 w-5 text-[#ee4d2d]' />
          <span className='font-medium'>Đã lưu để mua sau ({savedItems.length})</span>
          <motion.svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={2}
            stroke='currentColor'
            className='h-4 w-4'
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
          </motion.svg>
        </Button>
        {savedItems.length > 0 && (
          <Button
            animated={false}
            onClick={onClear}
            className='text-sm text-gray-500 transition-colors hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
          >
            Xóa tất cả
          </Button>
        )}
      </div>

      {/* Saved Items List */}
      <AnimatePresence mode='wait'>
        {isExpanded && (
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            className='space-y-3 overflow-hidden'
          >
            <AnimatePresence mode='popLayout'>
              {savedItems.map((item) => (
                <motion.div
                  key={item.product._id}
                  variants={itemVariants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                  layout
                  className='flex gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:border-gray-200 dark:border-slate-700 dark:hover:border-slate-600'
                >
                  {/* Product Image */}
                  <Link
                    to={`${path.home}${generateNameId({ name: item.product.name, id: item.product._id })}`}
                    className='h-20 w-20 shrink-0'
                  >
                    <ImageWithFallback
                      src={item.product.image}
                      alt={item.product.name}
                      className='h-full w-full rounded-sm object-cover'
                      loading='lazy'
                    />
                  </Link>

                  {/* Product Details */}
                  <div className='min-w-0 flex-1'>
                    <Link
                      to={`${path.home}${generateNameId({ name: item.product.name, id: item.product._id })}`}
                      className='line-clamp-2 text-sm text-gray-800 transition-colors hover:text-[#ee4d2d] dark:text-gray-200'
                    >
                      {item.product.name}
                    </Link>

                    {/* Price */}
                    <div className='mt-1 flex items-center gap-2 text-sm'>
                      <span className='text-gray-400 line-through dark:text-gray-500'>
                        ₫{formatCurrency(item.product.price_before_discount)}
                      </span>
                      <span className='font-medium text-[#ee4d2d]'>₫{formatCurrency(item.product.price)}</span>
                    </div>

                    {/* Saved time */}
                    <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
                      Đã lưu {getDaysSinceSaved(item.savedAt)} • SL: {item.originalBuyCount}
                    </p>

                    {/* Action Buttons */}
                    <div className='mt-2 flex items-center gap-3'>
                      <motion.div
                        whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                      >
                        <Button
                          animated={false}
                          onClick={() => onMoveToCart(item)}
                          className='rounded-sm bg-[#ee4d2d] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#d73211]'
                        >
                          Thêm vào giỏ
                        </Button>
                      </motion.div>
                      <Button
                        animated={false}
                        onClick={() => onRemove(item.product._id)}
                        className='text-sm text-gray-500 transition-colors hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

SaveForLaterSection.displayName = 'SaveForLaterSection'

export default SaveForLaterSection
