import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import productApi from 'src/apis/product.api'
import Product from 'src/pages/ProductList/components/Product'
import { ProductListConfig } from 'src/types/product.type'
import { RetryError } from 'src/types/utils.type'

interface ShopProductsProps {
  categoryId: string
}

const ShopProducts = ({ categoryId }: ShopProductsProps) => {
  const { t } = useTranslation('product')
  const scrollRef = useRef<HTMLDivElement>(null)

  const queryConfig: ProductListConfig = { limit: '10', page: '1', category: categoryId }

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['shopProducts', queryConfig],
    queryFn: ({ signal }) => productApi.getProducts(queryConfig, { signal }),
    enabled: Boolean(categoryId),
    staleTime: 3 * 60 * 1000,
    retry: (failureCount, error: RetryError) => {
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') return false
      return failureCount < 1
    },
  })

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.6
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? ('auto' as const)
      : ('smooth' as const)
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior })
  }

  if (isLoading) {
    return (
      <div className="mt-4" role="status" aria-label={t('related.loading')}>
        <span className="sr-only">{t('related.loading')}</span>
        <div className="container">
          <div className="rounded-sm bg-white p-4 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50">
            <div className="mb-4 h-5 w-40 animate-pulse rounded bg-gray-300 dark:bg-slate-700" />
            <div className="flex gap-3 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-44 shrink-0">
                  <div className="animate-pulse rounded-sm bg-white shadow-sm dark:bg-slate-800">
                    <div className="w-full pt-[100%] bg-gray-300 dark:bg-slate-700" />
                    <div className="p-2">
                      <div className="mb-2 h-4 rounded bg-gray-300 dark:bg-slate-700" />
                      <div className="h-4 w-2/3 rounded bg-gray-300 dark:bg-slate-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!productsData?.data?.data?.products?.length) return null

  return (
    <div className="mt-4">
      <div className="container">
        <div className="rounded-sm bg-white p-4 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50">
          <h2 className="mb-4 text-base text-gray-400 uppercase dark:text-gray-500">
            {t('related.fromThisShop')}
          </h2>
          <div
            className="group relative"
            role="region"
            aria-roledescription="carousel"
            aria-label={t('related.fromThisShop')}
          >
            {/* Left arrow */}
            <button
              onClick={() => scroll('left')}
              className="absolute top-1/2 left-0 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-md transition-opacity motion-reduce:transition-none focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange md:opacity-0 md:group-hover:opacity-100 dark:bg-slate-700/90"
              aria-label={t('related.scrollLeft')}
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            {/* Scrollable row */}
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide">
              {productsData.data.data.products.map((product) => (
                <div key={product._id} className="w-44 shrink-0">
                  <Product product={product} />
                </div>
              ))}
            </div>
            {/* Right arrow */}
            <button
              onClick={() => scroll('right')}
              className="absolute top-1/2 right-0 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-md transition-opacity motion-reduce:transition-none focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange md:opacity-0 md:group-hover:opacity-100 dark:bg-slate-700/90"
              aria-label={t('related.scrollRight')}
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShopProducts
