import { formatCurrency } from 'src/utils/utils'

interface PriceDisplayProps {
  price: number
  originalPrice?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showDiscount?: boolean
  currencySymbol?: string
}

const sizeClasses = {
  sm: { price: 'text-sm', original: 'text-xs', badge: 'text-xs px-1 py-0.5' },
  md: { price: 'text-lg', original: 'text-sm', badge: 'text-xs px-1 py-0.5' },
  lg: { price: 'text-2xl', original: 'text-base', badge: 'text-sm px-1.5 py-0.5' }
}

const PriceDisplay = ({
  price,
  originalPrice,
  className = '',
  size = 'md',
  showDiscount = true,
  currencySymbol = '₫'
}: PriceDisplayProps) => {
  const hasDiscount = originalPrice !== undefined && originalPrice > price
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  const sizes = sizeClasses[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {hasDiscount && (
        <span className={`text-gray-400 line-through dark:text-gray-500 ${sizes.original}`}>
          {currencySymbol}
          {formatCurrency(originalPrice)}
        </span>
      )}
      <span className={`font-semibold text-[#ee4d2d] ${sizes.price}`}>
        <span className={sizes.original}>{currencySymbol}</span>
        {formatCurrency(price)}
      </span>
      {hasDiscount && showDiscount && discountPercent > 0 && (
        <span className={`rounded-sm bg-[#ee4d2d] text-white ${sizes.badge}`}>-{discountPercent}%</span>
      )}
    </div>
  )
}

export default PriceDisplay
