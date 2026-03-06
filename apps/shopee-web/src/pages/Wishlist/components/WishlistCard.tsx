import { motion } from 'framer-motion'
import { Link } from 'react-router'
import Button from 'src/components/Button'
import ImageWithFallback from 'src/components/ImageWithFallback'
import ProductRating from 'src/components/ProductRating'
import path from 'src/constant/path'
import { Product } from 'src/types/product.type'
import { formatCurrency, formatNumberToSocialStyle, generateNameId } from 'src/utils/utils'
import {
  categoryIconComponents,
  IconCube,
  IconFire,
  IconLightning,
  IconShoppingCart,
  IconSparkles
} from './WishlistIcons'

interface WishlistCardProps {
  item: {
    _id: string
    product: Product
    addedAt: string
    mockCategory?: string
  }
  hoveredCardId: string | null
  onMouseEnter: () => void
  onMouseLeave: () => void
  onRemove: () => void
  onAddToCart: () => void
  isRecentlyAdded: (addedAt: string) => boolean
  isTrending: (product: Product) => boolean
  getStockStatus: (product: Product) => { label: string; color: string } | null
  getDiscountPercent: (product: Product) => number
  itemVariants: any
}

export default function WishlistCard({
  item,
  hoveredCardId,
  onMouseEnter,
  onMouseLeave,
  onRemove,
  onAddToCart,
  isRecentlyAdded,
  isTrending,
  getStockStatus,
  getDiscountPercent,
  itemVariants
}: WishlistCardProps) {
  const categoryName = item.product.category?.name || item.mockCategory || 'Sản phẩm'
  const discount = getDiscountPercent(item.product)
  const stock = getStockStatus(item.product)
  const recent = isRecentlyAdded(item.addedAt)
  const trending = isTrending(item.product)
  const getProductLink = (product: Product) => `${path.home}${generateNameId({ name: product.name, id: product._id })}`

  return (
    <motion.div
      key={item._id}
      variants={itemVariants}
      layout
      transition={{ duration: 0.2 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className='group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50 dark:hover:shadow-slate-900/70'
    >
      {/* Top-left badges stack */}
      <div className='absolute top-2 left-2 z-10 flex flex-col gap-1'>
        {recent && (
          <span className='inline-flex items-center gap-0.5 rounded-sm bg-linear-to-r from-blue-500 to-cyan-400 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs'>
            <IconSparkles className='h-2.5 w-2.5' /> MỚI
          </span>
        )}
        {trending && (
          <span className='inline-flex items-center gap-0.5 rounded-sm bg-linear-to-r from-amber-500 to-orange-400 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs'>
            <IconFire className='h-2.5 w-2.5' /> HOT
          </span>
        )}
        {stock && (
          <span className={`rounded-sm ${stock.color} px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs`}>
            {stock.label}
          </span>
        )}
      </div>

      {/* Discount badge - top right */}
      {discount > 0 && (
        <div className='absolute top-0 right-0 z-10'>
          <div className='relative inline-flex items-center gap-0.5 rounded-bl-lg bg-[#ee4d2d] px-2 py-1 text-[11px] font-bold text-white dark:bg-orange-500'>
            -{discount}%{discount >= 30 && <IconLightning className='h-2.5 w-2.5' />}
          </div>
        </div>
      )}

      {/* Delete button overlay - visible on hover */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: hoveredCardId === item._id ? 1 : 0,
          scale: hoveredCardId === item._id ? 1 : 0.8
        }}
        transition={{ duration: 0.15 }}
      >
        <Button
          animated={false}
          onClick={onRemove}
          className='absolute right-2 bottom-[calc(100%-2rem)] z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-md backdrop-blur-xs transition-all duration-150 hover:bg-red-500 hover:text-white focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-hidden active:scale-90 dark:bg-slate-700/90 dark:shadow-slate-900/50'
          aria-label='Xóa khỏi yêu thích'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-3.5 w-3.5'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
          </svg>
        </Button>
      </motion.div>

      {/* Product Image */}
      <Link
        to={getProductLink(item.product)}
        className='relative block w-full cursor-pointer overflow-hidden pt-[100%]'
      >
        <ImageWithFallback
          src={item.product.image}
          alt={item.product.name}
          className='absolute top-0 left-0 h-full w-full bg-white object-cover transition-transform duration-500 group-hover:scale-110 dark:bg-slate-700'
          loading='lazy'
        />
        <div className='absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
        {/* Heart icon overlay on hover */}
        <div className='absolute bottom-2 left-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
          <div className='flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs dark:bg-slate-800/80'>
            <svg className='h-4 w-4 text-red-500' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
            </svg>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className='p-3'>
        <Link
          to={getProductLink(item.product)}
          className='line-clamp-2 min-h-10 cursor-pointer text-xs leading-relaxed text-gray-800 transition-colors duration-150 hover:text-[#ee4d2d] dark:text-gray-100 dark:hover:text-orange-400'
        >
          {item.product.name}
        </Link>

        {/* Category Tag with icon */}
        <div className='mt-1.5'>
          <span className='inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-slate-700/50 dark:text-gray-400'>
            {(() => {
              const CatIcon = categoryIconComponents[categoryName] || IconCube
              return <CatIcon className='h-3 w-3' />
            })()}{' '}
            {categoryName}
          </span>
        </div>

        {/* Price */}
        <div className='mt-2 flex items-baseline gap-1.5'>
          <span className='truncate text-sm font-bold text-[#ee4d2d] dark:text-orange-400'>
            ₫{formatCurrency(item.product.price)}
          </span>
          {discount > 0 && (
            <span className='truncate text-[10px] text-gray-400 line-through dark:text-gray-500'>
              ₫{formatCurrency(item.product.price_before_discount)}
            </span>
          )}
        </div>

        {/* Rating & Sold */}
        <div className='mt-1.5 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400'>
          <ProductRating rating={item.product.rating} />
          <span>Đã bán {formatNumberToSocialStyle(item.product.sold)}</span>
        </div>

        {/* Add to Cart Button */}
        <Button
          animated={false}
          onClick={onAddToCart}
          className='mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-linear-to-r from-[#ee4d2d] to-[#ff6b4a] py-2 text-xs font-medium text-white shadow-xs transition-all duration-200 hover:from-[#d73211] hover:to-[#ee4d2d] hover:shadow-md hover:shadow-orange-500/20 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:outline-hidden active:scale-95 dark:from-orange-500 dark:to-orange-400 dark:shadow-slate-900/50 dark:hover:from-orange-600 dark:hover:to-orange-500 dark:focus:ring-orange-400'
          aria-label='Thêm vào giỏ hàng'
        >
          <IconShoppingCart className='h-3.5 w-3.5' />
          Thêm vào giỏ
        </Button>
      </div>
    </motion.div>
  )
}
