import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ProductListConfig } from 'src/types/product.type'
import { RetryError } from 'src/types/utils.type'

import categoryApi from 'src/apis/category.api'
import productApi from 'src/apis/product.api'

import ProductListItem from 'src/components/ProductListItem'
import ProductSkeleton from 'src/components/ProductSkeleton'
import SearchNoResults from 'src/components/SearchNoResults'
import AsideFilter from './components/AsideFilter'
import Product from './components/Product/Product'
import SortProductList from './components/SortProductList'

import SEO from 'src/components/SEO'
import Breadcrumb from 'src/components/Breadcrumb'
import Button from 'src/components/Button'
import path from 'src/constant/path'
import { normalizeProductQueryKey, useProductQueryStates } from 'src/hooks/nuqs'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'
import { useViewMode } from 'src/hooks/useViewMode'
import { useTranslation } from 'react-i18next'

/**
 * ProductListInfinite - Infinite Scroll version của ProductList
 * Sử dụng useInfiniteQuery từ TanStack Query
 */
const ProductListInfinite = () => {
  const { t } = useTranslation('home')
  const [filters, setFilters] = useProductQueryStates()

  // View Mode - Grid/List toggle with localStorage persistence
  const { viewMode, changeViewMode } = useViewMode()

  // Remove page from filters for infinite query (we manage pages internally)
  const infiniteQueryConfig = (() => {
    const { page, ...rest } = filters
    return { ...rest, limit: filters.limit }
  })()

  // Normalized key for cache compatibility
  const normalizedInfiniteKey = (() => {
    const { page, ...rest } = normalizeProductQueryKey(filters)
    return rest
  })()

  /**
   * Infinite Query for Products
   */
  const {
    data: productsData,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['products-infinite', normalizedInfiniteKey],
    queryFn: async ({ pageParam, signal }) => {
      const config = {
        ...infiniteQueryConfig,
        page: pageParam,
      } as ProductListConfig
      return productApi.getProducts(config, { signal })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data.data
      // Nếu page hiện tại < tổng số page thì còn data
      if (pagination.page < pagination.page_size) {
        return pagination.page + 1
      }
      return undefined // Không còn page nào
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: RetryError) => {
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        return false
      }
      return failureCount < 2
    },
  })

  /**
   * Query Categories
   */
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => categoryApi.getCategories({ signal }),
    staleTime: 15 * 60 * 1000,
  })

  // Flatten all products from all pages
  const allProducts = (() => {
    if (!productsData?.pages) return []
    return productsData.pages.flatMap((page) => page.data.data.products)
  })()

  // Get pagination info from last page
  const pagination = productsData?.pages[productsData.pages.length - 1]?.data.data.pagination

  // Infinite scroll hook
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    isLoading: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    threshold: 300,
  })

  const categories = categoriesData?.data.data || []

  // Grid columns count for virtualization
  const gridColumns = 5 // matches xl:grid-cols-5
  const gridRows = (() => {
    const rows: (typeof allProducts)[] = []
    for (let i = 0; i < allProducts.length; i += gridColumns) {
      rows.push(allProducts.slice(i, i + gridColumns))
    }
    return rows
  })()

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const gridVirtualizer = useVirtualizer({
    count: gridRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 320,
    overscan: 3,
  })

  const listVirtualizer = useVirtualizer({
    count: allProducts.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 120,
    overscan: 5,
  })

  // Get current category name for breadcrumb
  const currentCategory = filters.category
    ? categories.find((cat) => cat._id === filters.category)
    : null

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: t('breadcrumb.home'), to: path.home },
    ...(currentCategory
      ? [{ label: currentCategory.name }]
      : [{ label: t('breadcrumb.allProducts') }]),
  ]

  // Initial loading state with skeletons
  if (isLoading) {
    return (
      <div className="bg-[#f5f5f5] py-6 dark:bg-slate-900">
        <SEO title={t('loading')} />
        <div className="container">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="hidden md:col-span-3 md:block">
              <div className="animate-pulse rounded-xs bg-white p-4 dark:bg-slate-800">
                <div className="mb-4 h-6 w-3/4 rounded-sm bg-gray-200 dark:bg-slate-700" />
                <div className="space-y-3">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="h-4 w-full rounded-sm bg-gray-200 dark:bg-slate-700"
                      />
                    ))}
                </div>
              </div>
            </div>
            <div className="col-span-1 md:col-span-9">
              <div className="mb-6 animate-pulse rounded-xs bg-white p-3 dark:bg-slate-800">
                <div className="h-8 w-1/2 rounded-sm bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array(20)
                  .fill(0)
                  .map((_, index) => (
                    <ProductSkeleton key={index} />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !productsData) {
    return (
      <div className="bg-[#f5f5f5] py-6 dark:bg-slate-900">
        <div className="container">
          <div className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-200">
              {t('error.loadProducts')}
            </h2>
            <p className="mb-4 text-gray-500 dark:text-gray-400">{t('error.tryAgainLater')}</p>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              className="rounded-xs px-6 py-2"
            >
              {t('error.retry')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f5f5f5] py-6 dark:bg-slate-900">
      <SEO
        title={currentCategory ? currentCategory.name : t('allProductsTitle')}
        description={t('allProductsMeta')}
      />

      <div className="container">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-4" />

        {/* Background fetching indicator */}
        <AnimatePresence>
          {isFetching && !isFetchingNextPage && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              role="status"
              aria-live="polite"
              className="fixed top-20 right-4 z-50 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-orange"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{t('updating')}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {allProducts.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="hidden md:col-span-3 md:block">
              <AsideFilter categories={categories} />
            </div>
            <div className="col-span-1 md:col-span-9">
              <SortProductList
                pageSize={pagination?.page_size || 0}
                viewMode={viewMode}
                onViewChange={changeViewMode}
              />

              {/* Products Grid/List View */}
              <div
                ref={scrollContainerRef}
                tabIndex={0}
                role="region"
                aria-label={viewMode === 'grid' ? 'Product grid' : 'Product list'}
                className="mt-6 overflow-auto"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              >
                {viewMode === 'grid' ? (
                  <div
                    style={{
                      height: `${gridVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {gridVirtualizer.getVirtualItems().map((virtualRow) => {
                      const rowProducts = gridRows[virtualRow.index]
                      return (
                        <div
                          key={virtualRow.index}
                          ref={(el) => gridVirtualizer.measureElement(el)}
                          data-index={virtualRow.index}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className="grid grid-cols-2 gap-3 pb-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        >
                          {rowProducts.map((product) => (
                            <div className="col-span-1" key={product._id}>
                              <Product product={product} />
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      height: `${listVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {listVirtualizer.getVirtualItems().map((virtualRow) => {
                      const product = allProducts[virtualRow.index]
                      return (
                        <div
                          key={product._id}
                          ref={(el) => listVirtualizer.measureElement(el)}
                          data-index={virtualRow.index}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className="pb-3"
                        >
                          <ProductListItem product={product} />
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Loading more skeletons */}
                {isFetchingNextPage && viewMode === 'grid' && (
                  <div
                    aria-hidden="true"
                    className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  >
                    {Array(10)
                      .fill(0)
                      .map((_, index) => (
                        <ProductSkeleton key={`skeleton-${index}`} />
                      ))}
                  </div>
                )}
                {isFetchingNextPage && viewMode === 'list' && (
                  <div aria-hidden="true" className="space-y-3">
                    {Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <div
                          key={`skeleton-${index}`}
                          className="flex animate-pulse overflow-hidden rounded-lg bg-white shadow-xs dark:bg-slate-800 dark:shadow-slate-900/20"
                        >
                          <div className="h-32 w-32 shrink-0 bg-gray-200 sm:h-40 sm:w-40 md:h-48 md:w-48 dark:bg-slate-700" />
                          <div className="flex-1 space-y-3 p-4">
                            <div className="h-4 w-3/4 rounded-sm bg-gray-200 dark:bg-slate-700" />
                            <div className="h-4 w-1/2 rounded-sm bg-gray-200 dark:bg-slate-700" />
                            <div className="h-3 w-1/4 rounded-sm bg-gray-200 dark:bg-slate-700" />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Sentinel element for infinite scroll */}
              <div ref={sentinelRef} className="h-4" />

              {/* Load more status */}
              <div className="mt-6 text-center">
                {isFetchingNextPage && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300"
                  >
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-orange"></div>
                    <span>{t('loadingMore')}</span>
                  </div>
                )}
                {!hasNextPage && allProducts.length > 0 && (
                  <p className="py-4 text-gray-500 dark:text-gray-400">
                    {t('allProductsShown', { count: allProducts.length })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state - Enhanced with SearchNoResults when there's a search query */}
        {allProducts.length === 0 &&
          !isLoading &&
          (filters.name ? (
            <SearchNoResults
              searchTerm={filters.name}
              onPopularSearch={(term) => {
                setFilters({ name: term, page: 1 })
              }}
            />
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 h-24 w-24">
                <svg
                  aria-hidden="true"
                  className="h-full w-full text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-600 dark:text-gray-300">
                {t('empty.noProducts')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">{t('empty.adjustFilters')}</p>
            </div>
          ))}
      </div>
    </div>
  )
}

export default ProductListInfinite
