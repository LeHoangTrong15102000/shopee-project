import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import ProductRating from 'src/components/ProductRating'
import OptimizedImage from 'src/components/OptimizedImage'
import WishlistButton from 'src/components/WishlistButton'
import path from 'src/constant/path'
import { Product } from 'src/types/product.type'
import { formatCurrency, formatNumberToSocialStyle, generateNameId } from 'src/utils/utils'
import { scrollManager } from 'src/hooks/useScrollRestoration'

interface ProductListItemProps {
  product: Product
}

const ProductListItem = ({ product }: ProductListItemProps) => {
  const { t } = useTranslation('product')
  const navigate = useNavigate()

  const handleProductClick = useCallback(() => {
    // Lưu vị trí scroll hiện tại trước khi navigate
    scrollManager.savePosition(window.location.pathname, window.location.search, window.scrollY)

    // Navigate đến product detail
    navigate(`${path.home}${generateNameId({ name: product.name, id: product._id })}`)
  }, [navigate, product.name, product._id])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleProductClick()
    }
  }

  return (
    <div
      onClick={handleProductClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role='link'
      aria-label={`${product.name} - ₫${formatCurrency(product.price)}`}
      className='relative flex cursor-pointer overflow-hidden rounded-lg bg-white shadow-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange dark:bg-slate-800 dark:shadow-slate-900/20'
    >
      {/* Product Image - Left side */}
      <div className='relative h-32 w-32 shrink-0 sm:h-40 sm:w-40 md:h-48 md:w-48'>
        <OptimizedImage
          src={product.image}
          alt={product.name}
          aspectRatio='1:1'
          loading='lazy'
          className='h-full w-full object-cover'
          showSkeleton={true}
          blurPlaceholder={true}
        />
        {/* Wishlist Button */}
        <div className='absolute top-2 right-2 z-10'>
          <WishlistButton productId={product._id} productName={product.name} size='sm' />
        </div>
      </div>

      {/* Product Info - Right side */}
      <div className='flex min-w-0 flex-1 flex-col justify-between p-3 sm:p-4'>
        {/* Product Name */}
        <div>
          <h3 className='mb-2 line-clamp-2 text-sm font-medium text-gray-800 sm:text-base dark:text-gray-200'>
            {product.name}
          </h3>

          {/* Price Section */}
          <div className='mb-2 flex items-center gap-2'>
            {product.price_before_discount > product.price && (
              <span className='text-xs text-gray-400 line-through sm:text-sm dark:text-gray-500'>
                <span>₫</span>
                {formatCurrency(product.price_before_discount)}
              </span>
            )}
            <span className='text-sm font-semibold text-[#ee4d2d] sm:text-lg dark:text-orange-400'>
              <span className='text-xs sm:text-sm'>₫</span>
              {formatCurrency(product.price)}
            </span>
            {product.price_before_discount > product.price && (
              <span className='rounded-sm bg-[#ee4d2d] px-1 py-0.5 text-xs text-white dark:bg-orange-500'>
                -{Math.round(((product.price_before_discount - product.price) / product.price_before_discount) * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Rating and Sold */}
        <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4'>
          <div className='flex items-center gap-1'>
            <ProductRating rating={product.rating} />
            <span className='text-xs text-gray-500 dark:text-gray-400'>({product.rating.toFixed(1)})</span>
          </div>
          <div className='text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
            <span>{t('info.sold')} </span>
            <span className='font-medium'>{formatNumberToSocialStyle(product.sold)}</span>
          </div>
        </div>

        {/* Location */}
        <div className='mt-2 flex items-center text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
          <svg className='mr-1 h-3 w-3 shrink-0 sm:h-4 sm:w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
            />
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
          </svg>
          <span className='truncate'>{product.location}</span>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductListItem)
