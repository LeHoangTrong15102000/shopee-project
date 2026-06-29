import { useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { RetryError } from 'src/types/utils.type'

import productApi from 'src/apis/product.api'

import ProductReviews from 'src/components/ProductReviews'
import ProductQA from 'src/components/ProductQA'
import ProductVariantSelector from 'src/components/ProductVariantSelector'

import path from 'src/constant/path'

import { getIdFromNameId, generateNameId } from 'src/utils/utils'
import {
  ProductImages,
  ProductInfo,
  ProductActions,
  RelatedProducts,
  Breadcrumb,
  ProductSpecifications,
  ShopInfo,
  ShopProducts,
} from './components'
import PriceHistoryChart from './components/PriceHistoryChart'

import { AppContext } from 'src/contexts/app.context'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'
import SEO from 'src/components/SEO'
import { SITE_URL } from 'src/components/SEO'
import { convert } from 'html-to-text'
import { useRecentlyViewed } from 'src/hooks/useRecentlyViewed'
import useLivePriceUpdate from 'src/hooks/useLivePriceUpdate'
import usePresence from 'src/hooks/usePresence'
import useViewerCount from 'src/hooks/useViewerCount'
import useLiveReviews from 'src/hooks/useLiveReviews'
import useLiveQA from 'src/hooks/useLiveQA'
import useActivityFeed from 'src/hooks/useActivityFeed'
import LiveReviewFeed from 'src/components/LiveReviewFeed'
import LiveQASection from 'src/components/LiveQASection'
import ActivityFeedWidget from 'src/components/ActivityFeedWidget'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { staggerContainer, sectionEntrance, STAGGER_DELAY } from 'src/styles/animations'
import Button from 'src/components/Button'
import { ProductVariant, ProductVariantCombination } from 'src/types/variant.type'
import { ProductSKU } from 'src/types/product.type'

/**
 * ProductDetail Component với Query Cancellation
 * Tự động hủy request cũ khi user navigate giữa các sản phẩm khác nhau
 */
const ProductDetail = () => {
  const { t } = useTranslation('product')
  const { isAuthenticated } = useContext(AppContext)
  const reducedMotion = useReducedMotion()
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [needsCollapse, setNeedsCollapse] = useState(false)
  const [showVariantError, setShowVariantError] = useState(false)
  const [isPriceHistoryExpanded, setIsPriceHistoryExpanded] = useState(false)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const infoContainerVariants = staggerContainer(STAGGER_DELAY.normal)

  const { nameId } = useParams()
  const id = getIdFromNameId(nameId as string)
  const navigate = useNavigate()

  // Hook để track sản phẩm đã xem gần đây
  const { addProduct: addToRecentlyViewed } = useRecentlyViewed()

  // WebSocket: Live price updates for this product
  const {
    price: livePrice,
    priceBeforeDiscount: livePriceBeforeDiscount,
    hasChanged: priceHasChanged,
    previousPrice,
  } = useLivePriceUpdate(id)

  // WebSocket: Real-time viewer count for this product
  const { viewerCount, isPopular } = useViewerCount(id)

  // WebSocket: Live reviews for this product
  const {
    newReviews,
    newComments: _newComments,
    likeUpdates: _reviewLikeUpdates,
    clearNewReviews,
  } = useLiveReviews(id)

  // WebSocket: Live Q&A for this product
  const {
    newQuestions,
    newAnswers,
    likeUpdates: _qaLikeUpdates,
    clearNewQuestions: _clearNewQuestions,
  } = useLiveQA(id)

  // WebSocket: Activity feed for this product
  const { latestActivity } = useActivityFeed(id)

  /**
   * Query Product Detail với automatic cancellation
   * TanStack Query sẽ tự động hủy request cũ khi id thay đổi
   */
  const {
    data: productDetailData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: ({ signal }) => {
      return productApi.getProductDetail(id as string, { signal })
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: RetryError) => {
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        return false
      }
      if (error?.response?.status === 404) {
        return false
      }
      return failureCount < 1
    },
  })

  const product =
    productDetailData?.status === HTTP_STATUS_CODE.NotFound ? null : productDetailData?.data?.data

  // Price history query — only fetches when user expands the section
  const { data: priceHistoryData, isLoading: isPriceHistoryLoading } = useQuery({
    queryKey: ['priceHistory', id],
    queryFn: () => productApi.getPriceHistory(id as string),
    enabled: isPriceHistoryExpanded && Boolean(id),
    staleTime: 10 * 60 * 1000,
  })

  // Variant selection state
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [selectedSKU, setSelectedSKU] = useState<ProductSKU | null>(null)

  // Variants & SKUs come directly from the backend product response.
  // A product with no variants simply renders no variant selector.
  const variants: ProductVariant[] = product?.variants ?? []
  const skus: ProductSKU[] = product?.skus ?? []

  // Convert SKUs to combinations for the selector component
  const combinations: ProductVariantCombination[] = skus.map((sku, i) => ({
    _id: sku._id || `combo-${i}`,
    variant_values: sku.variant_values,
    price: sku.price,
    price_before_discount: product?.price_before_discount ?? sku.price,
    quantity: sku.stock,
    sku: sku.value,
    image: sku.image,
  }))

  const hasVariants = variants.length > 0

  // Handle variant selection
  const handleVariantSelect = (type: string, value: string) => {
    setShowVariantError(false)
    setSelectedVariants((prev) => {
      const next = { ...prev }
      if (next[type] === value) {
        delete next[type] // Deselect
      } else {
        next[type] = value
      }
      return next
    })
  }

  // Callback for ProductActions to trigger variant validation error highlight
  const handleVariantValidationError = () => {
    setShowVariantError(true)
  }

  // Find matching SKU when variant selection changes
  useEffect(() => {
    if (!hasVariants) {
      setSelectedSKU(null)
      return
    }
    // Check if all variant types are selected
    const allSelected = variants.every((v) => selectedVariants[v.type] !== undefined)
    if (!allSelected) {
      setSelectedSKU(null)
      return
    }
    // Find matching SKU
    const match = skus.find((sku) =>
      Object.entries(selectedVariants).every(([type, value]) => sku.variant_values[type] === value),
    )
    setSelectedSKU(match || null)
  }, [selectedVariants, skus, variants, hasVariants])

  // Reset variant selection when product changes
  useEffect(() => {
    setSelectedVariants({})
    setSelectedSKU(null)
  }, [product?._id])

  // WebSocket: Seller online presence (using shop/category ID as seller proxy)
  const { isOnline: isSellerOnline, lastSeen: sellerLastSeen } = usePresence(
    product?.category?._id ? `shop_${product.category._id}` : undefined,
  )

  // Track sản phẩm đã xem khi product load thành công
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product)
    }
  }, [product?._id])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [product?._id])

  // Measure description content height to decide if collapse button is needed
  useEffect(() => {
    if (descriptionRef.current) {
      setNeedsCollapse(descriptionRef.current.scrollHeight > 288)
    }
  }, [product?.description])

  // Handle 404 case
  if (productDetailData?.status === HTTP_STATUS_CODE.NotFound) {
    return (
      <div className="bg-neutral-100 py-6 dark:bg-slate-900">
        <div className="container">
          <div className="py-16 text-center">
            <h1 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">
              {t('detail.notFound')}
            </h1>
            <p className="mb-6 text-gray-500 dark:text-gray-400">{t('detail.notFoundDesc')}</p>
            <Button
              variant="primary"
              onClick={() => navigate(path.home)}
              className="rounded-xs px-6 py-3"
            >
              {t('detail.goHome')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading || !product) {
    return (
      <div
        className="bg-neutral-100 py-6 dark:bg-slate-900"
        role="status"
        aria-label={t('detail.loading')}
      >
        <span className="sr-only">{t('detail.loading')}</span>
        <div className="container">
          {/* Breadcrumb skeleton */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-gray-300 dark:bg-slate-700"></div>
            <div className="h-4 w-3 animate-pulse rounded bg-gray-300 dark:bg-slate-700"></div>
            <div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-slate-700"></div>
            <div className="h-4 w-3 animate-pulse rounded bg-gray-300 dark:bg-slate-700"></div>
            <div className="h-4 w-40 animate-pulse rounded bg-gray-300 dark:bg-slate-700"></div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-9">
            {/* Product images skeleton */}
            <div className="col-span-12 md:col-span-5">
              <div className="relative w-full animate-pulse rounded-sm bg-gray-300 pt-[100%] dark:bg-slate-700"></div>
              <div className="relative mt-3 grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="relative w-full animate-pulse rounded-sm bg-gray-300 pt-[100%] dark:bg-slate-700"
                  ></div>
                ))}
              </div>
            </div>

            {/* Product info skeleton */}
            <div className="col-span-12 md:col-span-7">
              {/* Badge */}
              <div className="mb-2 h-5 w-16 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700"></div>
              {/* Title */}
              <div className="mb-4 h-8 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700"></div>
              {/* Rating row */}
              <div className="mb-4 h-6 w-3/4 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700"></div>
              {/* Price */}
              <div className="mb-4 h-12 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700"></div>
              {/* Voucher row */}
              <div className="mb-3 h-8 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700"></div>
              {/* Protection row */}
              <div className="mb-3 h-8 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700"></div>
              {/* Shipping row */}
              <div className="mb-6 h-12 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700"></div>
              {/* Quantity */}
              <div className="h-12 w-1/3 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !product) {
    return (
      <div className="bg-neutral-100 py-6 dark:bg-slate-900">
        <div className="container">
          <div className="py-16 text-center">
            <h1 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">
              {t('error.title')}
            </h1>
            <p className="mb-6 text-gray-500 dark:text-gray-400">{t('error.loadFailed')}</p>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              className="rounded-xs px-6 py-3"
            >
              {t('error.retry')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="bg-neutral-100 py-6 dark:bg-slate-900">
      <SEO
        title={t('meta.title', { name: product.name })}
        description={convert(product.description, { limits: { maxInputLength: 200 } })}
        image={product.image}
        type="product"
        url={`${SITE_URL}/${generateNameId({ name: product.name, id: product._id })}`}
        jsonLd={[
          {
            '@type': 'Product',
            name: product.name,
            image: product.image,
            description: convert(product.description, { limits: { maxInputLength: 500 } }),
            brand: { '@type': 'Brand', name: 'Shopee Clone' },
            offers: {
              '@type': 'Offer',
              url: `${SITE_URL}/${generateNameId({ name: product.name, id: product._id })}`,
              price: product.price,
              priceCurrency: 'VND',
              availability:
                product.quantity > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: product.rating,
              reviewCount: product.sold,
              bestRating: 5,
              worstRating: 1,
            },
          },
        ]}
      />
      {/* Thông tin sản phẩm */}
      <div className="container">
        <Breadcrumb
          categoryName={product.category.name}
          categoryId={product.category._id}
          productName={product.name}
        />
        <div className="rounded-sm bg-white p-4 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50">
          <div className="grid grid-cols-12 gap-2 lg:gap-9">
            {/* Ảnh sản phẩm và slider */}
            <ProductImages
              product={product}
              reducedMotion={reducedMotion}
              selectedSKU={selectedSKU}
            />
            {/* Thông tin sản phẩm */}
            <div className="col-span-12 md:col-span-7">
              <ProductInfo
                product={product}
                viewerCount={viewerCount}
                isPopular={isPopular}
                reducedMotion={reducedMotion}
                livePrice={livePrice}
                livePriceBeforeDiscount={livePriceBeforeDiscount}
                priceHasChanged={priceHasChanged}
                previousPrice={previousPrice}
                infoContainerVariants={infoContainerVariants}
                selectedSKU={selectedSKU}
              />
              {/* Variant Selector */}
              {hasVariants && (
                <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <ProductVariantSelector
                    variants={variants}
                    combinations={combinations}
                    selectedValues={selectedVariants}
                    onSelect={handleVariantSelect}
                    showValidationError={showVariantError}
                  />
                </div>
              )}
              <ProductActions
                product={product}
                isAuthenticated={isAuthenticated}
                reducedMotion={reducedMotion}
                selectedSKU={selectedSKU}
                hasVariants={hasVariants}
                onVariantValidationError={handleVariantValidationError}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Thông tin Shop */}
      <motion.div
        className="mt-4"
        variants={reducedMotion ? undefined : sectionEntrance}
        initial={reducedMotion ? undefined : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container">
          <ShopInfo
            categoryName={product.category?.name}
            location={product.location}
            rating={product.rating}
            isSellerOnline={isSellerOnline}
            sellerLastSeen={sellerLastSeen}
            shopId={product.shop_id}
          />
        </div>
      </motion.div>
      {/* Mô tả sản phẩm */}
      <motion.div
        className="mt-4"
        variants={reducedMotion ? undefined : sectionEntrance}
        initial={reducedMotion ? undefined : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container">
          <div className="rounded-sm bg-white p-8 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50">
            {/* Product Specifications */}
            <ProductSpecifications product={product} />
            {/* Description Title */}
            <h2 className="rounded-sm text-base font-medium text-gray-900 uppercase md:text-lg dark:text-gray-100">
              {t('detail.description')}
            </h2>
            {/* Thông tin chi tiết sản phẩm */}
            <div className="relative">
              <div
                ref={descriptionRef}
                className={`mx-4 mt-6 mb-4 text-sm leading-loose text-gray-700 dark:text-gray-300 overflow-hidden transition-all duration-300 motion-reduce:transition-none ${
                  needsCollapse && !isDescriptionExpanded ? 'max-h-72' : ''
                }`}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(product.description),
                  }}
                />
              </div>
              {needsCollapse && !isDescriptionExpanded && (
                <div className="pointer-events-none absolute bottom-8 left-0 h-16 w-full bg-gradient-to-t from-white dark:from-slate-800" />
              )}
              {needsCollapse && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  aria-expanded={isDescriptionExpanded}
                  className="mx-auto mt-2 flex min-h-11 items-center gap-1 px-4 py-2 text-sm font-medium text-orange hover:text-orange/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange dark:text-orange-400 dark:hover:text-orange-300"
                >
                  {isDescriptionExpanded ? t('description.seeLess') : t('description.seeMore')}
                  <svg
                    aria-hidden="true"
                    className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${isDescriptionExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Price History Chart */}
      <div className="mt-4">
        <div className="container">
          <div className="rounded-sm bg-white p-4 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50">
            <button
              type="button"
              onClick={() => setIsPriceHistoryExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between text-sm font-medium text-gray-700 hover:text-orange dark:text-gray-200 dark:hover:text-orange-400"
              aria-expanded={isPriceHistoryExpanded}
            >
              <span>View price history</span>
              <svg
                aria-hidden="true"
                className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${isPriceHistoryExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isPriceHistoryExpanded && (
              <div className="mt-4">
                {isPriceHistoryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange border-t-transparent" />
                  </div>
                ) : (
                  <PriceHistoryChart data={priceHistoryData?.data?.data ?? []} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Live Review Feed - Phase 3 */}
      {newReviews.length > 0 && (
        <div className="mt-4">
          <div className="container">
            <LiveReviewFeed
              newReviewCount={newReviews.length}
              latestReview={
                newReviews.length > 0
                  ? {
                      name: newReviews[newReviews.length - 1].user.name,
                      rating: newReviews[newReviews.length - 1].rating,
                    }
                  : undefined
              }
              onViewReviews={() => {
                clearNewReviews()
                document
                  .getElementById('product-reviews')
                  ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
              }}
            />
          </div>
        </div>
      )}
      {/* Đánh giá sản phẩm */}
      <motion.div
        className="mt-4"
        variants={reducedMotion ? undefined : sectionEntrance}
        initial={reducedMotion ? undefined : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.1 }}
      >
        <div className="container">
          <div id="product-reviews">
            <ProductReviews productId={product._id} />
          </div>
        </div>
      </motion.div>
      {/* Live Q&A Section - Phase 3 */}
      {(newQuestions.length > 0 || newAnswers.length > 0) && (
        <div className="mt-4">
          <div className="container">
            <LiveQASection
              newQuestionCount={newQuestions.length}
              newAnswers={newAnswers.map((a) => ({
                question_id: a.question_id,
                answer: a.answer,
              }))}
              onViewQuestions={() => {
                document
                  .getElementById('product-qa')
                  ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
              }}
            />
          </div>
        </div>
      )}
      {/* Hỏi đáp sản phẩm */}
      <motion.div
        className="mt-4"
        variants={reducedMotion ? undefined : sectionEntrance}
        initial={reducedMotion ? undefined : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.1 }}
      >
        <div className="container">
          <div id="product-qa">
            <ProductQA productId={product._id} />
          </div>
        </div>
      </motion.div>
      {/* Sản phẩm của Shop */}
      <motion.div
        variants={reducedMotion ? undefined : sectionEntrance}
        initial={reducedMotion ? undefined : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.1 }}
      >
        <ShopProducts categoryId={product.category._id} />
      </motion.div>
      {/* Mục sản phẩm yêu thích */}
      <RelatedProducts categoryId={product.category._id} reducedMotion={reducedMotion} />
      {/* Activity Feed Widget - Phase 3 */}
      <ActivityFeedWidget
        latestActivity={latestActivity}
        className="fixed bottom-4 left-4 z-50 max-w-xs"
      />
    </div>
  )
}

export default ProductDetail
