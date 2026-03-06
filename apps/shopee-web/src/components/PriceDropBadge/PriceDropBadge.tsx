import { useMemo } from 'react'
import { motion } from 'framer-motion'
import classNames from 'classnames'
import { useReducedMotion } from 'src/hooks/useReducedMotion'

export interface PriceDropBadgeProps {
  originalPrice: number
  currentPrice: number
  className?: string
}

export default function PriceDropBadge({ originalPrice, currentPrice, className }: PriceDropBadgeProps) {
  const prefersReducedMotion = useReducedMotion()

  // Calculate discount percentage
  const discountPercentage = useMemo(() => {
    if (originalPrice <= 0 || currentPrice >= originalPrice) return 0
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
  }, [originalPrice, currentPrice])

  // Don't render if no discount
  if (discountPercentage <= 0) return null

  const badgeContent = (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400',
        className
      )}
      aria-label={`Giá đã giảm ${discountPercentage} phần trăm`}
    >
      <svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
      </svg>
      <span>Giảm {discountPercentage}%</span>
    </span>
  )

  if (prefersReducedMotion) {
    return badgeContent
  }

  return (
    <motion.div
      className='inline-block'
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 15
      }}
    >
      {badgeContent}
    </motion.div>
  )
}
