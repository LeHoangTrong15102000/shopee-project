import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Product } from 'src/types/product.type'
import { useProductComparison } from 'src/hooks/useProductComparison'
import Button from 'src/components/Button'

interface CompareButtonProps {
  product: Product
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function CompareButton({ product, className, size = 'md' }: CompareButtonProps) {
  const { t } = useTranslation('compare')
  const { isInCompare, addToCompare, removeFromCompare, canAddMore } = useProductComparison()
  const isComparing = isInCompare(product._id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isComparing) {
      removeFromCompare(product._id)
      toast.info(t('removedFromCompare'))
    } else {
      if (!canAddMore) {
        toast.warning(t('maxCompareReached'))
        return
      }
      addToCompare(product)
      toast.success(t('addedToCompare'))
    }
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

  const ariaLabel = isComparing
    ? t('removeFromCompareAriaLabel', { name: product.name })
    : t('addToCompareAriaLabel', { name: product.name })

  return (
    <Button
      variant='icon'
      animated={false}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-pressed={isComparing}
      tabIndex={0}
      title={isComparing ? t('removeFromCompareTitle') : t('addToCompareTitle')}
      className={classNames(
        'flex items-center justify-center bg-white/80 shadow-xs transition-all duration-200 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900',
        sizeClasses[size],
        className
      )}
    >
      <svg
        className={classNames('transition-colors duration-200', iconSizeClasses[size])}
        fill={isComparing ? '#ee4d2d' : 'none'}
        stroke={isComparing ? '#ee4d2d' : 'currentColor'}
        strokeWidth='2'
        viewBox='0 0 24 24'
        aria-hidden='true'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        />
      </svg>
    </Button>
  )
}
