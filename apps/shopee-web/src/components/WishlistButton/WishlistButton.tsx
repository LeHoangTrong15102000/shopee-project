import { toast } from 'react-toastify'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useOptimisticWishlist } from 'src/hooks/optimistic'
import { TOAST_MESSAGES } from 'src/hooks/optimistic/shared/constants'
import Button from 'src/components/Button'

interface WishlistButtonProps {
  productId: string
  productName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function WishlistButton({ productId, productName, className, size = 'md' }: WishlistButtonProps) {
  const { t } = useTranslation('product')
  const { isInWishlist, isLoading, isAuthenticated, toggleWishlist } = useOptimisticWishlist(productId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.warning(TOAST_MESSAGES.WISHLIST_LOGIN_REQUIRED)
      return
    }

    toggleWishlist()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(e as unknown as React.MouseEvent)
    }
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  }

  const ariaLabel = isLoading
    ? t('wishlist.processing')
    : isInWishlist
      ? t('wishlist.removeFromWishlist', { name: productName || t('wishlist.product') })
      : t('wishlist.addToWishlist', { name: productName || t('wishlist.product') })

  return (
    <Button
      variant='icon'
      animated={false}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      aria-label={ariaLabel}
      aria-pressed={isInWishlist}
      aria-busy={isLoading}
      tabIndex={0}
      className={classNames(
        'flex items-center justify-center bg-white/80 shadow-xs transition-all duration-200 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700',
        sizeClasses[size],
        { 'cursor-not-allowed opacity-50': isLoading },
        className
      )}
      title={isInWishlist ? t('wishlist.removeTitle') : t('wishlist.addTitle')}
    >
      {isLoading ? (
        <svg
          className='h-4 w-4 animate-spin text-orange dark:text-orange-400'
          fill='none'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
        </svg>
      ) : (
        <svg
          className={classNames('transition-colors duration-200', iconSizeClasses[size], {
            'text-[#ee4d2d]': isInWishlist,
            'text-gray-500 dark:text-gray-400': !isInWishlist
          })}
          fill={isInWishlist ? 'currentColor' : 'none'}
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
          />
        </svg>
      )}
    </Button>
  )
}
