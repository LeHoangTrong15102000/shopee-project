import { motion, AnimatePresence, Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import ProductRating from 'src/components/ProductRating'
import ViewerCountBadge from 'src/components/ViewerCountBadge'
import LivePriceTag from 'src/components/LivePriceTag'
import { Product as ProductType, ProductSKU } from 'src/types/product.type'
import { formatCurrency, formatNumberToSocialStyle, rateSale } from 'src/utils/utils'
import { staggerItem } from 'src/styles/animations'
import ProductBadges from './ProductBadges'
import VoucherRow from './VoucherRow'
import ShopeeProtection from './ShopeeProtection'
import ShippingInfo from './ShippingInfo'

const LOW_STOCK_THRESHOLD = 5

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
  selectedSKU?: ProductSKU | null
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
  infoContainerVariants,
  selectedSKU,
}: ProductInfoProps) => {
  const { t } = useTranslation('product')

  // Determine effective price and stock based on selected SKU
  const effectivePrice = selectedSKU?.price ?? livePrice ?? product.price
  const effectivePriceBeforeDiscount = selectedSKU
    ? product.price_before_discount
    : (livePriceBeforeDiscount ?? product.price_before_discount)
  const effectiveStock = selectedSKU?.stock ?? product.quantity
  const isLowStock =
    selectedSKU != null && effectiveStock > 0 && effectiveStock <= LOW_STOCK_THRESHOLD
  const isOutOfStock = selectedSKU != null && effectiveStock === 0

  return (
    <motion.div
      variants={reducedMotion ? undefined : infoContainerVariants}
      initial={reducedMotion ? undefined : 'hidden'}
      animate={reducedMotion ? undefined : 'visible'}
    >
      {/* Badges */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <ProductBadges />
      </motion.div>
      {/* Title */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <h1 className="text-xl font-medium text-gray-900 capitalize dark:text-gray-100">
          {product.name}
        </h1>
      </motion.div>
      {/* Viewer count badge - real-time */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <ViewerCountBadge viewerCount={viewerCount} isPopular={isPopular} className="mt-2" />
      </motion.div>
      {/* Rating and Stats */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <div className="mt-6 flex flex-wrap items-center gap-y-2">
          {/* Rating */}
          <div className="flex items-center">
            <span className="mr-1 border-b border-b-orange text-orange dark:text-orange-400">
              {product.rating}
            </span>
            <ProductRating
              rating={product.rating}
              activeClassname="h-4 w-4 fill-orange text-orange dark:text-orange-400"
              nonActiveClassname="h-4 w-4 fill-current text-gray-300 dark:text-gray-600"
            />
          </div>
          <div className="mx-4 h-7 w-px bg-gray-300/80 dark:bg-slate-600"></div>
          {/* Reviews */}
          <div className="flex items-center">
            <span className="mr-1 border-b border-b-black/90 text-black/90 dark:border-b-gray-300 dark:text-gray-200">
              {formatNumberToSocialStyle(3000)}
            </span>
            <span className="text-sm text-black/60 capitalize dark:text-gray-400">
              {t('info.reviews')}
            </span>
          </div>
          <div className="mx-4 h-7 w-px bg-gray-300/80 dark:bg-slate-600"></div>
          {/* Sold */}
          <div className="flex items-center">
            <span className="mr-1 text-black/90 dark:text-gray-200">
              {formatNumberToSocialStyle(product.sold)}
            </span>
            <span className="text-sm text-black/60 capitalize dark:text-gray-400">
              {t('info.sold')}
            </span>
          </div>
        </div>
      </motion.div>
      {/* Price Section - Live Price Updates / Variant Price */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <div className="mt-3 bg-gray-50 dark:bg-slate-700">
          <div className="flex flex-col items-start justify-center px-4 py-3 md:px-5 md:py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSKU?._id ?? 'default'}
                initial={reducedMotion ? undefined : { opacity: 0, y: 5 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="flex min-h-8 w-full flex-wrap items-center">
                  {/* Original Price */}
                  <div
                    className="mr-3 text-sm text-gray-400 line-through md:text-base dark:text-gray-400"
                    aria-label={t('info.originalPriceAria', {
                      price: formatCurrency(effectivePriceBeforeDiscount),
                    })}
                  >
                    ₫{formatCurrency(effectivePriceBeforeDiscount)}
                  </div>
                  {/* Live Price Tag / SKU Price */}
                  <div className="flex items-center">
                    {selectedSKU ? (
                      <span className="text-xl font-medium text-orange md:text-3xl">
                        ₫{formatCurrency(selectedSKU.price)}
                      </span>
                    ) : (
                      <LivePriceTag
                        currentPrice={product.price}
                        livePrice={livePrice}
                        previousPrice={previousPrice}
                        hasChanged={priceHasChanged}
                        className="text-3xl"
                      />
                    )}
                    <div className="ml-4 rounded-sm bg-orange px-1.5 py-0.5 text-xs font-semibold text-white uppercase">
                      {rateSale(effectivePriceBeforeDiscount, effectivePrice)} {t('info.discount')}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            {/* Low stock warning */}
            {isLowStock && (
              <div className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                ⚠ {t('variant.lowStock', { count: effectiveStock })}
              </div>
            )}
            {/* Out of stock message */}
            {isOutOfStock && (
              <div className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                {t('variant.outOfStock')}
              </div>
            )}
          </div>
        </div>
      </motion.div>
      {/* Voucher Row */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <VoucherRow />
      </motion.div>
      {/* Shopee Protection */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <ShopeeProtection />
      </motion.div>
      {/* Shipping Info */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <ShippingInfo location={product.location || ''} />
      </motion.div>
    </motion.div>
  )
}

export default ProductInfo
