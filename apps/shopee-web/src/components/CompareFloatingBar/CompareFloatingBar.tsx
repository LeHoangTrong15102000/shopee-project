import { memo, useState, useCallback } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import Button from 'src/components/Button'
import { useProductComparison } from 'src/hooks/useProductComparison'

interface CompareFloatingBarProps {
  className?: string
  comparePath?: string
}

function CompareFloatingBar({ className, comparePath = '/compare' }: CompareFloatingBarProps) {
  const { t } = useTranslation('compare')
  const { compareList, removeFromCompare, clearCompare } = useProductComparison()
  const [isExpanded, setIsExpanded] = useState(true)

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const handleRemoveFromCompare = useCallback(
    (productId: string) => {
      removeFromCompare(productId)
    },
    [removeFromCompare]
  )

  const handleClearCompare = useCallback(() => {
    clearCompare()
  }, [clearCompare])

  if (compareList.length === 0) {
    return null
  }

  return (
    <div
      role='region'
      aria-label={t('tableAriaLabel')}
      className={classNames(
        'fixed right-0 bottom-0 left-0 z-50 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.15)] transition-transform duration-300',
        { 'translate-y-[calc(100%-48px)]': !isExpanded },
        className
      )}
    >
      <Button
        animated={false}
        onClick={handleToggleExpand}
        className='absolute -top-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-t-lg bg-white px-4 py-1 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]'
        aria-label={isExpanded ? t('tableAriaLabel') : t('tableAriaLabel')}
        aria-expanded={isExpanded}
      >
        <span className='text-sm font-medium text-gray-700'>{t('comparing', { count: compareList.length })}</span>
        <svg
          className={classNames('h-4 w-4 text-gray-500 transition-transform', { 'rotate-180': isExpanded })}
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          aria-hidden='true'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
        </svg>
      </Button>

      <div className='container mx-auto px-4 py-3'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex flex-1 items-center gap-3 overflow-x-auto' role='list' aria-label={t('tableAriaLabel')}>
            {compareList.map((product) => (
              <div key={product._id} className='group relative shrink-0' role='listitem'>
                <img
                  src={product.image}
                  alt={product.name}
                  className='h-10 w-10 rounded-lg border border-gray-200 object-cover sm:h-14 sm:w-14'
                />
                <Button
                  animated={false}
                  onClick={() => handleRemoveFromCompare(product._id)}
                  className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100'
                  aria-label={t('removeAriaLabel', { name: product.name })}
                >
                  <svg className='h-3 w-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </Button>
                <div
                  className='pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-sm bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100'
                  role='tooltip'
                  aria-hidden='true'
                >
                  {product.name.length > 30 ? product.name.slice(0, 30) + '...' : product.name}
                </div>
              </div>
            ))}

            {Array.from({ length: 4 - compareList.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 sm:h-14 sm:w-14'
                aria-label={t('addProduct')}
                role='listitem'
              >
                <svg
                  className='h-6 w-6 text-gray-300'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  aria-hidden='true'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                </svg>
              </div>
            ))}
          </div>

          <div className='flex shrink-0 items-center gap-3'>
            <Button
              animated={false}
              onClick={handleClearCompare}
              className='px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-800'
              aria-label={t('clearAllAriaLabel')}
            >
              {t('clearAll')}
            </Button>
            <Link
              to={comparePath}
              className={classNames(
                'truncate rounded-sm bg-orange px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#d73211]',
                { 'pointer-events-none opacity-50': compareList.length < 2 }
              )}
              aria-label={t('compareAriaLabel', { count: compareList.length })}
              aria-disabled={compareList.length < 2}
              tabIndex={compareList.length < 2 ? -1 : undefined}
            >
              {t('compareNow', { count: compareList.length })}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(CompareFloatingBar)
