import { useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import { useContext, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { RetryError } from 'src/types/utils.type'

import productApi from 'src/apis/product.api'

import ProductReviews from 'src/components/ProductReviews'
import PriceHistoryChart from 'src/components/PriceHistoryChart'
import ProductQA from 'src/components/ProductQA'
import ShippingEstimate from 'src/components/ShippingEstimate'
import path from 'src/constant/path'

import { getIdFromNameId, generateNameId } from 'src/utils/utils'
import { ProductImages, ProductInfo, ProductActions, RelatedProducts } from './components'

import { AppContext } from 'src/contexts/app.context'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'
import SEO from 'src/components/SEO'
import { SITE_URL } from 'src/components/SEO'
import { convert } from 'html-to-text'
import { useRecentlyViewed } from 'src/hooks/useRecentlyViewed'
import useLivePriceUpdate from 'src/hooks/useLivePriceUpdate'
import usePresence from 'src/hooks/usePresence'
import OnlineIndicator from 'src/components/OnlineIndicator'
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

// Type cho purchase
export type AddToCartType = {
  product_id: string
  buy_count: number
}

/**
 * ProductDetail Component với Query Cancellation
 * Tự động hủy request cũ khi user navigate giữa các sản phẩm khác nhau
 */
const ProductDetail = () => {
  const { t } = useTranslation('product')
  const { isAuthenticated } = useContext(AppContext)
  const reducedMotion = useReducedMotion()
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
    previousPrice
  } = useLivePriceUpdate(id)

  // WebSocket: Real-time viewer count for this product
  const { viewerCount, isPopular } = useViewerCount(id)

  // WebSocket: Live reviews for this product
  const { newReviews, newComments: _newComments, likeUpdates: _reviewLikeUpdates, clearNewReviews } = useLiveReviews(id)

  // WebSocket: Live Q&A for this product
  const { newQuestions, newAnswers, likeUpdates: _qaLikeUpdates, clearNewQuestions: _clearNewQuestions } = useLiveQA(id)

  // WebSocket: Activity feed for this product
  const { latestActivity } = useActivityFeed(id)

  /**
   * Query Product Detail với automatic cancellation
   * TanStack Query sẽ tự động hủy request cũ khi id thay đổi
   */
  const {
    data: productDetailData,
    isLoading,
    error
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
    }
  })

  const product = productDetailData?.status === HTTP_STATUS_CODE.NotFound ? null : productDetailData?.data?.data

  // WebSocket: Seller online presence (using shop/category ID as seller proxy)
  const { isOnline: isSellerOnline, lastSeen: sellerLastSeen } = usePresence(
    product?.category?._id ? `shop_${product.category._id}` : undefined
  )

  // Track sản phẩm đã xem khi product load thành công
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product)
    }
  }, [product?._id])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [product?._id])

  // Handle 404 case
  if (productDetailData?.status === HTTP_STATUS_CODE.NotFound) {
    return (
      <div className='bg-gray-200 py-6 dark:bg-slate-900'>
        <div className='container'>
          <div className='py-16 text-center'>
            <h1 className='mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200'>{t('detail.notFound')}</h1>
            <p className='mb-6 text-gray-500 dark:text-gray-400'>{t('detail.notFoundDesc')}</p>
            <Button variant='primary' onClick={() => navigate(path.home)} className='rounded-xs px-6 py-3'>
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
      <div className='bg-gray-200 py-6 dark:bg-slate-900'>
        <div className='container'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-9'>
            {/* Product images skeleton */}
            <div className='col-span-12 md:col-span-5'>
              <div className='relative w-full animate-pulse rounded-sm bg-gray-300 pt-[100%] dark:bg-slate-700'></div>
              <div className='relative mt-3 grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5'>
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className='relative w-full animate-pulse rounded-sm bg-gray-300 pt-[100%] dark:bg-slate-700'
                  ></div>
                ))}
              </div>
            </div>

            {/* Product info skeleton */}
            <div className='col-span-7'>
              <div className='mb-4 h-8 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700'></div>
              <div className='mb-4 h-6 w-3/4 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700'></div>
              <div className='mb-6 h-8 w-1/2 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700'></div>
              <div className='mb-6 h-20 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700'></div>
              <div className='h-12 w-1/3 animate-pulse rounded-sm bg-gray-300 dark:bg-slate-700'></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !product) {
    return (
      <div className='bg-gray-200 py-6 dark:bg-slate-900'>
        <div className='container'>
          <div className='py-16 text-center'>
            <h1 className='mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200'>{t('error.title')}</h1>
            <p className='mb-6 text-gray-500 dark:text-gray-400'>{t('error.loadFailed')}</p>
            <Button variant='primary' onClick={() => window.location.reload()} className='rounded-xs px-6 py-3'>
              {t('error.retry')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className='bg-gray-200 py-6 dark:bg-slate-900'>
      <SEO
        title={t('meta.title', { name: product?.name })}
        description={convert(product?.description, { limits: { maxInputLength: 200 } })}
        image={product.image}
        type='product'
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
              availability: product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: product.rating,
              reviewCount: product.sold,
              bestRating: 5,
              worstRating: 1
            }
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
              {
                '@type': 'ListItem',
                position: 2,
                name: product.category.name,
                item: `${SITE_URL}/products?category=${product.category._id}`
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: product.name
              }
            ]
          }
        ]}
      />
      {/* Thông tin sản phẩm */}
      <div className='container'>
        <div className='bg-white p-4 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50'>
          <div className='grid grid-cols-12 gap-2 lg:gap-9'>
            {/* Ảnh sản phẩm và slider */}
            <ProductImages product={product} reducedMotion={reducedMotion} />
            {/* Thông tin sản phẩm */}
            <div className='col-span-12 md:col-span-7'>
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
              />
              <ProductActions product={product} isAuthenticated={isAuthenticated} reducedMotion={reducedMotion} />
            </div>
          </div>
        </div>
      </div>
      {/* Thông tin Shop */}
      <motion.div
        className='mt-8'
        variants={reducedMotion ? undefined : sectionEntrance}
        initial={reducedMotion ? undefined : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className='container'>
          <div className='rounded-xs bg-white p-4 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50'>
            <div className='flex items-center gap-4'>
              {/* Shop Avatar */}
              <div className='shrink-0'>
                <div className='flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-orange bg-gray-200 dark:bg-slate-700'>
                  <svg className='h-10 w-10 text-gray-400 dark:text-gray-500' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                  </svg>
                </div>
              </div>
              {/* Shop Info */}
              <div className='flex-1'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                  Shop {product.location || 'Shopee'}
                </h3>
                <OnlineIndicator isOnline={isSellerOnline} lastSeen={sellerLastSeen} size='sm' className='mt-1' />
                <div className='mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400'>
                  <span className='flex items-center gap-1'>
                    <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                    {product.location || 'Việt Nam'}
                  </span>
                  <span className='flex items-center gap-1'>
                    <svg className='h-4 w-4 fill-current text-yellow-400' viewBox='0 0 20 20'>
                      <path d='M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z' />
                    </svg>
                    {product.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Thông tin vận chuyển và lịch sử giá */}
      <motion.div
        className='mt-8'
        variants={reducedMotion ? undefined : sectionEntrance}
        initial={reducedMotion ? undefined : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className='container'>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {/* Shipping Estimate */}
            <ShippingEstimate productLocation='TP. Hồ Chí Minh' selectedAddress='' className='h-fit' />
            {/* Price History Chart */}
            <PriceHistoryChart productId={product._id} currentPrice={product.price} className='h-fit' />
          </div>
        </div>
      </motion.div>
      {/* Mô tả sản phẩm */}
      <motion.div
        className='mt-8'
        variants={reducedMotion ? undefined : sectionEntrance}
        initial={reducedMotion ? undefined : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className='container'>
          <div className='bg-white p-8 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50'>
            {/* Title */}
            <div className='rounded-sm text-base font-medium text-[rgba(0,0,0,.87)] uppercase md:text-lg dark:text-gray-100'>
              {t('detail.specifications')}
            </div>
            {/* Thông tin chi tiết sản phẩm */}
            <div className='mx-4 mt-12 mb-4 text-sm leading-loose text-gray-700 dark:text-gray-300'>
              <div
                dangerouslySetInnerHTML={{
                  // __html: DOMPurify.sanitize(`<div onClick={alert('Ok')}>hehe</div>`) -> DOMpurify chống tấn công XSS
                  __html: DOMPurify.sanitize(product.description)
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
      {/* Live Review Feed - Phase 3 */}
      {newReviews.length > 0 && (
        <div className='mt-4'>
          <div className='container'>
            <LiveReviewFeed
              newReviewCount={newReviews.length}
              latestReview={
                newReviews.length > 0
                  ? {
                      name: newReviews[newReviews.length - 1].user.name,
                      rating: newReviews[newReviews.length - 1].rating
                    }
                  : undefined
              }
              onViewReviews={() => {
                clearNewReviews()
                document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth' })
              }}
            />
          </div>
        </div>
      )}
      {/* Đánh giá sản phẩm */}
      <motion.div
        className='mt-8'
        variants={reducedMotion ? undefined : sectionEntrance}
        initial={reducedMotion ? undefined : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.1 }}
      >
        <div className='container'>
          <div id='product-reviews'>
            <ProductReviews productId={product._id} />
          </div>
        </div>
      </motion.div>
      {/* Live Q&A Section - Phase 3 */}
      {(newQuestions.length > 0 || newAnswers.length > 0) && (
        <div className='mt-4'>
          <div className='container'>
            <LiveQASection
              newQuestionCount={newQuestions.length}
              newAnswers={newAnswers.map((a) => ({
                question_id: a.question_id,
                answer: a.answer
              }))}
              onViewQuestions={() => {
                document.getElementById('product-qa')?.scrollIntoView({ behavior: 'smooth' })
              }}
            />
          </div>
        </div>
      )}
      {/* Hỏi đáp sản phẩm */}
      <motion.div
        className='mt-8'
        variants={reducedMotion ? undefined : sectionEntrance}
        initial={reducedMotion ? undefined : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.1 }}
      >
        <div className='container'>
          <div id='product-qa'>
            <ProductQA productId={product._id} />
          </div>
        </div>
      </motion.div>
      {/* Mục sản phẩm yêu thích */}
      <RelatedProducts categoryId={product.category._id} reducedMotion={reducedMotion} />
      {/* Activity Feed Widget - Phase 3 */}
      <ActivityFeedWidget latestActivity={latestActivity} className='fixed bottom-4 left-4 z-50 max-w-xs' />
    </div>
  )
}

export default ProductDetail
