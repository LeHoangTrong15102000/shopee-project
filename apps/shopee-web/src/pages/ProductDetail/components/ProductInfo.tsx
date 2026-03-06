import { motion, Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import ProductRating from 'src/components/ProductRating'
import ShareButton from 'src/components/ShareButton'
import ViewerCountBadge from 'src/components/ViewerCountBadge'
import LivePriceTag from 'src/components/LivePriceTag'
import Button from 'src/components/Button'
import { Product as ProductType } from 'src/types/product.type'
import { formatCurrency, formatNumberToSocialStyle, rateSale } from 'src/utils/utils'
import { staggerItem } from 'src/styles/animations'

interface ProductInfoProps {
  product: ProductType
  reducedMotion: boolean
  livePrice: number | null
  livePriceBeforeDiscount: number | null
  priceHasChanged: boolean
  previousPrice: number | null
  viewerCount: number
  isPopular: boolean
  infoContainerVariants: Variants
}

const ProductInfo = ({
  product,
  reducedMotion,
  livePrice,
  livePriceBeforeDiscount,
  priceHasChanged,
  previousPrice,
  viewerCount,
  isPopular,
  infoContainerVariants
}: ProductInfoProps) => {
  const { t } = useTranslation('product')
  return (
    <motion.div
      variants={reducedMotion ? undefined : infoContainerVariants}
      initial={reducedMotion ? undefined : 'hidden'}
      animate={reducedMotion ? undefined : 'visible'}
    >
      {/* Title */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <h1 className='text-xl font-medium text-gray-900 capitalize dark:text-gray-100'>{product?.name}</h1>
      </motion.div>
      {/* Viewer count badge - real-time */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <ViewerCountBadge viewerCount={viewerCount} isPopular={isPopular} className='mt-2' />
      </motion.div>
      {/* Rating and Stats */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <div className='mt-6 flex items-center'>
          {/* Rating */}
          <div className='flex items-center'>
            <span className='mr-1 border-b border-b-orange text-orange dark:text-orange-400'>{product?.rating}</span>
            <ProductRating
              rating={product?.rating}
              activeClassname='h-4 w-4 fill-orange text-orange dark:text-orange-400'
              nonActiveClassname='h-4 w-4 fill-current text-gray-300 dark:text-gray-600'
            />
          </div>
          <div className='mx-4 h-7 w-px bg-gray-300/80 dark:bg-slate-600'></div>
          {/* Reviews */}
          <div className='flex items-center'>
            <span className='mr-1 border-b border-b-black/90 text-black/90 dark:border-b-gray-300 dark:text-gray-200'>
              3k
            </span>
            <span className='text-sm text-black/60 capitalize dark:text-gray-400'>{t('info.reviews')}</span>
          </div>
          <div className='mx-4 h-7 w-px bg-gray-300/80 dark:bg-slate-600'></div>
          {/* Sold */}
          <div className='flex items-center'>
            <span className='mr-1 text-black/90 dark:text-gray-200'>{formatNumberToSocialStyle(product.sold)}</span>
            <span className='text-sm text-black/60 capitalize dark:text-gray-400'>{t('info.sold')}</span>
          </div>
          {/* Share & Report */}
          <div className='ml-auto flex items-center gap-3'>
            <ShareButton
              url={window.location.href}
              title={product.name}
              description={product.description?.slice(0, 150)}
              image={product.image}
            />
            <Button
              variant='text'
              size='sm'
              animated={false}
              className='text-sm text-black/60 hover:text-orange dark:text-gray-400 dark:hover:text-orange-400'
            >
              {t('info.report')}
            </Button>
          </div>
        </div>
      </motion.div>
      {/* Price Section - Live Price Updates */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <div className='mt-3 bg-[#fafafa] dark:bg-slate-700'>
          <div className='flex flex-col items-start justify-center px-4 py-3 md:px-5 md:py-4'>
            <div className='flex items-center'>
              <div className='flex min-h-7.5 w-full flex-wrap items-center'>
                {/* Original Price */}
                <div
                  className='mr-3 text-sm text-[#929292] line-through md:text-base dark:text-gray-400'
                  aria-label={t('info.originalPriceAria', {
                    price: formatCurrency(livePriceBeforeDiscount ?? product?.price_before_discount)
                  })}
                >
                  ₫{formatCurrency(livePriceBeforeDiscount ?? product?.price_before_discount)}
                </div>
                {/* Live Price Tag */}
                <div className='flex items-center'>
                  <LivePriceTag
                    currentPrice={product?.price}
                    livePrice={livePrice}
                    previousPrice={previousPrice}
                    hasChanged={priceHasChanged}
                    priceBeforeDiscount={livePriceBeforeDiscount ?? product?.price_before_discount}
                    className='text-xl md:text-[1.875rem]'
                  />
                  <div className='ml-4 rounded-sm bg-orange px-1 py-0.5 text-xs font-semibold text-white uppercase'>
                    {rateSale(livePrice ?? product?.price, livePriceBeforeDiscount ?? product?.price_before_discount)}{' '}
                    {t('info.discount')}
                  </div>
                </div>
              </div>
            </div>
            <div className='mt-3 flex items-center'></div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ProductInfo
