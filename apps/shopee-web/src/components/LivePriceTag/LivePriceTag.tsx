import classNames from 'classnames'
import { formatCurrency } from 'src/utils/utils'

interface LivePriceTagProps {
  currentPrice: number
  livePrice: number | null
  previousPrice: number | null
  hasChanged: boolean
  priceBeforeDiscount?: number | null
  className?: string
}

export default function LivePriceTag({
  currentPrice,
  livePrice,
  previousPrice,
  hasChanged,
  priceBeforeDiscount,
  className
}: LivePriceTagProps) {
  const displayPrice = livePrice ?? currentPrice
  const priceDecreased = previousPrice !== null && displayPrice < previousPrice
  const priceIncreased = previousPrice !== null && displayPrice > previousPrice

  return (
    <div className={classNames('relative', className)}>
      {/* Previous price with strikethrough during transition */}
      {hasChanged && previousPrice !== null && (
        <div className='mb-1 animate-pulse'>
          <span className='text-sm text-gray-400 line-through'>₫{formatCurrency(previousPrice)}</span>
        </div>
      )}

      {/* Current price */}
      <span
        className={classNames('text-xl font-medium text-orange transition-all duration-500', {
          'scale-110 text-green-600': hasChanged && priceDecreased,
          'scale-110 text-red-600': hasChanged && priceIncreased
        })}
      >
        ₫{formatCurrency(displayPrice)}
      </span>

      {/* Price before discount */}
      {priceBeforeDiscount && priceBeforeDiscount > displayPrice && (
        <span className='ml-3 text-sm text-gray-500 line-through'>₫{formatCurrency(priceBeforeDiscount)}</span>
      )}

      {/* Price change badge */}
      {hasChanged && (
        <span
          className={classNames(
            'ml-2 inline-block animate-bounce rounded-full px-2 py-0.5 text-xs font-medium text-white',
            priceDecreased ? 'bg-green-500' : 'bg-red-500'
          )}
        >
          {priceDecreased ? '↓ Giảm giá' : '↑ Tăng giá'}
        </span>
      )}
    </div>
  )
}
