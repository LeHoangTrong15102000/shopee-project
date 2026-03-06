import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'src/components/Button'
import { useReducedMotion } from 'src/hooks/useReducedMotion'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const Sparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className='absolute h-1.5 w-1.5 rounded-full bg-orange/40'
    style={{ left: x, top: y }}
    animate={{
      scale: [0, 1, 0],
      opacity: [0, 0.8, 0]
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      delay,
      ease: 'easeInOut'
    }}
  />
)

const DefaultEmptyIcon = () => (
  <svg
    className='h-12 w-12 text-gray-300 dark:text-gray-500'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={1.5}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
    />
  </svg>
)

const sparklePositions = [
  { x: -8, y: 10, delay: 0 },
  { x: 70, y: 5, delay: 0.5 },
  { x: 75, y: 60, delay: 1 },
  { x: -5, y: 65, delay: 1.5 },
  { x: 35, y: -5, delay: 0.8 }
]

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className='mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-700'>
          {icon || <DefaultEmptyIcon />}
        </div>
        <h3 className='mb-2 text-base font-medium text-gray-700 dark:text-gray-200'>{title}</h3>
        {description && (
          <p className='mb-4 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400'>{description}</p>
        )}
        {action && (
          <Button
            variant='primary'
            animated={false}
            onClick={action.onClick}
            className='flex items-center gap-2 rounded-xs px-6 py-2 text-sm font-medium'
          >
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <motion.div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className='relative mb-4'>
        {sparklePositions.map((sparkle, index) => (
          <Sparkle key={index} delay={sparkle.delay} x={sparkle.x} y={sparkle.y} />
        ))}
        <motion.div
          className='flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-700'
          animate={{
            y: [0, -10, 0],
            rotate: [0, -5, 5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {icon || <DefaultEmptyIcon />}
        </motion.div>
      </div>

      <motion.h3
        className='mb-2 text-base font-medium text-gray-700 dark:text-gray-200'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          className='mb-4 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow: [
              '0 0 0 0 rgba(238, 77, 45, 0)',
              '0 0 0 8px rgba(238, 77, 45, 0.15)',
              '0 0 0 0 rgba(238, 77, 45, 0)'
            ]
          }}
          transition={{
            opacity: { duration: 0.4, delay: 0.5 },
            y: { duration: 0.4, delay: 0.5 },
            boxShadow: { duration: 2, repeat: Infinity, delay: 1 }
          }}
          style={{ borderRadius: '2px' }}
        >
          <Button
            variant='primary'
            animated={false}
            onClick={action.onClick}
            className='flex items-center gap-2 rounded-xs px-6 py-2 text-sm font-medium'
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

export const EmptyCart = ({ onShopNow }: { onShopNow?: () => void }) => {
  const { t } = useTranslation('cart')
  return (
    <EmptyState
      icon={
        <svg
          className='h-12 w-12 text-gray-300 dark:text-gray-500'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={1.5}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
          />
        </svg>
      }
      title={t('empty.title')}
      description={t('empty.description')}
      action={onShopNow ? { label: t('empty.shopNow'), onClick: onShopNow } : undefined}
    />
  )
}

export const EmptySearch = ({ searchTerm, onClear }: { searchTerm?: string; onClear?: () => void }) => {
  const { t } = useTranslation('home')
  return (
    <EmptyState
      icon={
        <svg
          className='h-12 w-12 text-gray-300 dark:text-gray-500'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={1.5}
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
        </svg>
      }
      title={t('search.noResults')}
      description={searchTerm ? t('search.noResultsFor', { term: searchTerm }) : t('search.noResultsGeneric')}
      action={onClear ? { label: t('search.clearFilters'), onClick: onClear } : undefined}
    />
  )
}

export const EmptyWishlist = ({ onExplore }: { onExplore?: () => void }) => {
  const { t } = useTranslation('product')
  return (
    <EmptyState
      icon={
        <svg
          className='h-12 w-12 text-gray-300 dark:text-gray-500'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={1.5}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
          />
        </svg>
      }
      title={t('wishlist.emptyTitle')}
      description={t('wishlist.emptyDescription')}
      action={onExplore ? { label: t('wishlist.exploreNow'), onClick: onExplore } : undefined}
    />
  )
}

export const EmptyOrders = ({ onShopNow }: { onShopNow?: () => void }) => {
  const { t } = useTranslation('user')
  return (
    <EmptyState
      icon={
        <svg
          className='h-12 w-12 text-gray-300 dark:text-gray-500'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={1.5}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
          />
        </svg>
      }
      title={t('orders.emptyTitle')}
      description={t('orders.emptyDescription')}
      action={onShopNow ? { label: t('orders.shopNow'), onClick: onShopNow } : undefined}
    />
  )
}
