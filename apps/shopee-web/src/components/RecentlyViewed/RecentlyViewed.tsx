import { memo, useCallback } from 'react'
import { Link } from 'react-router'
import { RecentlyViewedProduct } from 'src/hooks/useRecentlyViewed'
import { formatCurrency, generateNameId } from 'src/utils/utils'
import path from 'src/constant/path'
import ProductRating from 'src/components/ProductRating'
import Button from 'src/components/Button'

interface RecentlyViewedProps {
  products: RecentlyViewedProduct[]
  maxItems?: number
  className?: string
  onRemove?: (productId: string) => void
  onClearAll?: () => void
}

function RecentlyViewed({ products, maxItems = 10, className = '', onRemove, onClearAll }: RecentlyViewedProps) {
  const displayProducts = products.slice(0, maxItems)

  if (displayProducts.length === 0) {
    return null
  }

  return (
    <section
      className={`rounded-xs bg-white p-4 shadow-sm dark:bg-slate-800 ${className}`}
      aria-label='Sản phẩm đã xem gần đây'
    >
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-sm font-medium text-gray-500 uppercase dark:text-gray-400'>Sản phẩm đã xem gần đây</h2>
        {onClearAll && displayProducts.length > 0 && (
          <Button
            animated={false}
            onClick={onClearAll}
            className='text-sm text-[#ee4d2d] transition-colors hover:text-[#d73211]'
            aria-label='Xóa tất cả sản phẩm đã xem'
          >
            Xóa tất cả
          </Button>
        )}
      </div>

      {/* Mobile: Horizontal scroll */}
      <div className='scrollbar-hide overflow-x-auto md:hidden' aria-live='polite'>
        <div className='flex gap-3' style={{ width: 'max-content' }} role='list' aria-label='Danh sách sản phẩm đã xem'>
          {displayProducts.map((product) => (
            <div key={product._id} className='relative w-32 shrink-0' role='listitem'>
              <ProductCard product={product} onRemove={onRemove} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Grid 6 columns */}
      <div
        className='hidden gap-3 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
        role='list'
        aria-label='Danh sách sản phẩm đã xem'
        aria-live='polite'
      >
        {displayProducts.map((product) => (
          <div key={product._id} className='relative' role='listitem'>
            <ProductCard product={product} onRemove={onRemove} />
          </div>
        ))}
      </div>
    </section>
  )
}

interface ProductCardProps {
  product: RecentlyViewedProduct
  onRemove?: (productId: string) => void
}

const ProductCard = memo(function ProductCard({ product, onRemove }: ProductCardProps) {
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onRemove?.(product._id)
    },
    [onRemove, product._id]
  )

  return (
    <article className='group relative overflow-hidden rounded-xs border border-gray-100 bg-white transition-shadow hover:shadow-md dark:border-slate-600 dark:bg-slate-800'>
      {onRemove && (
        <Button
          animated={false}
          onClick={handleRemove}
          className='absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70'
          aria-label={`Xóa sản phẩm ${product.name} khỏi danh sách đã xem`}
        >
          <svg className='h-3 w-3 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </Button>
      )}

      <Link
        to={`${path.home}${generateNameId({ name: product.name, id: product._id })}`}
        className='block'
        aria-label={`Xem chi tiết sản phẩm ${product.name}, giá ${formatCurrency(product.price)} đồng`}
      >
        <div className='relative pt-[100%]'>
          <img
            src={product.image}
            alt={`Hình ảnh sản phẩm ${product.name}`}
            className='absolute top-0 left-0 h-full w-full object-cover'
          />
        </div>
        <div className='p-2'>
          <h3 className='line-clamp-2 min-h-8 text-xs text-gray-800 dark:text-gray-200'>{product.name}</h3>
          <div className='mt-1 flex items-center gap-1'>
            <span className='text-sm font-medium text-[#ee4d2d]'>₫{formatCurrency(product.price)}</span>
          </div>
          {product.price_before_discount > product.price && (
            <span className='text-xs text-gray-400 line-through'>₫{formatCurrency(product.price_before_discount)}</span>
          )}
          <div className='mt-1 flex items-center gap-1'>
            <ProductRating
              rating={product.rating}
              activeClassname='h-2.5 w-2.5 fill-[#ee4d2d] text-[#ee4d2d]'
              nonActiveClassname='h-2.5 w-2.5 fill-current text-gray-300 dark:text-gray-600'
            />
            <span className='text-xs text-gray-500 dark:text-gray-400'>Đã bán {product.sold}</span>
          </div>
        </div>
      </Link>
    </article>
  )
})

export default memo(RecentlyViewed)
