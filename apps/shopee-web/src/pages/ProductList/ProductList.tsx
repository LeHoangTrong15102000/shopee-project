import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ProductListConfig } from 'src/types/product.type'
import { RetryError } from 'src/types/utils.type'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'

import categoryApi from 'src/apis/category.api'
import productApi from 'src/apis/product.api'

import AsideFilter from './components/AsideFilter'
import SortProductList from './components/SortProductList'
import Pagination from 'src/components/Pagination'
import Product from './components/Product/Product'
import ProductListItem from 'src/components/ProductListItem'
import MobileFilterDrawer from 'src/components/MobileFilterDrawer'
import SearchNoResults from 'src/components/SearchNoResults'

import path from 'src/constant/path'
import { useProductQueryStates, normalizeProductQueryKey } from 'src/hooks/nuqs'
import { useScrollRestoration } from 'src/hooks/useScrollRestoration'
import { useViewMode } from 'src/hooks/useViewMode'
import { useIsMobile } from 'src/hooks/useIsMobile'
import SEO from 'src/components/SEO'
import { SITE_URL } from 'src/components/SEO'
import { useTranslation } from 'react-i18next'
import Loader from 'src/components/Loader'
import Button from 'src/components/Button'

/**
 * ProductList Component với Query Cancellation
 * Tự động hủy request cũ khi queryConfig thay đổi (filter, search, pagination)
 */
const ProductList = () => {
  const { t } = useTranslation('home')
  const [filters, setFilters] = useProductQueryStates()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const containerVariants = isMobile
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.015 }
        }
      }

  // State cho Mobile Filter Drawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  // View Mode - Grid/List toggle with localStorage persistence
  const { viewMode, changeViewMode } = useViewMode()

  // Scroll Restoration - tự động lưu và khôi phục vị trí scroll
  const { scrollToTop } = useScrollRestoration(`product-list-${JSON.stringify(filters)}`, true)

  // Scroll to top chỉ khi có thay đổi filter/search/sort (không phải pagination)
  useEffect(() => {
    const { page, ...restConfig } = filters
    const isFilterChange = Object.values(restConfig).some((value) => value && value !== '')

    // Chỉ scroll to top khi có filter change, không scroll khi chỉ thay đổi page
    if (isFilterChange && page === 1) {
      scrollToTop()
    }
  }, [filters, scrollToTop])

  /**
   * Query Products với automatic cancellation
   * TanStack Query sẽ tự động hủy request cũ khi queryKey ['products', filters] thay đổi
   */
  const {
    data: productsData,
    isLoading,
    isFetching,
    error
  } = useQuery({
    queryKey: ['products', normalizeProductQueryKey(filters)],
    queryFn: ({ signal }) => {
      // Truyền AbortSignal vào API call để support cancellation
      return productApi.getProducts(filters as ProductListConfig, { signal })
    },
    placeholderData: (previousData) => previousData, // Giữ data cũ khi loading
    staleTime: 3 * 60 * 1000, // 3 phút
    retry: (failureCount, error: RetryError) => {
      // Không retry nếu request bị abort (do cancellation)
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        return false
      }
      // Không retry cho lỗi 404 (không tìm thấy sản phẩm)
      if (error?.response?.status === 404) {
        return false
      }
      return failureCount < 2 // Retry tối đa 2 lần cho các lỗi khác
    }
  })

  /**
   * Query Categories với Query Cancellation
   * Cache lâu hơn vì categories ít thay đổi
   */
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => {
      // Truyền AbortSignal vào API call
      return categoryApi.getCategories({ signal })
    },
    staleTime: 15 * 60 * 1000, // Cache 15 phút vì categories ít thay đổi
    retry: (failureCount, error: RetryError) => {
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        return false
      }
      return failureCount < 1
    }
  })

  // Handle error và empty state
  useEffect(() => {
    if (
      productsData?.data.data.products.length === 0 &&
      productsData?.data.data.pagination.page !== 1 &&
      !isLoading &&
      !error
    ) {
      // Redirect về trang 1 nếu không có sản phẩm và không phải trang 1
      setFilters({ page: 1 })
    }
  }, [productsData, isLoading, error, setFilters])

  // Loading state - hiển thị loader khi lần đầu load
  if (isLoading && !productsData) {
    return (
      <div className='bg-[#f5f5f5] py-6 dark:bg-slate-900'>
        <div className='container'>
          <Loader />
        </div>
      </div>
    )
  }

  // Error state
  if (error && !productsData) {
    return (
      <div className='bg-[#f5f5f5] py-6 dark:bg-slate-900'>
        <div className='container'>
          <div className='py-12 text-center'>
            <h2 className='mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300'>{t('error.loadProducts')}</h2>
            <p className='mb-4 text-gray-500 dark:text-gray-400'>{t('error.tryAgainLater')}</p>
            <Button variant='primary' onClick={() => window.location.reload()} className='rounded-xs px-6 py-2'>
              {t('error.retry')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const products = productsData?.data.data.products || []
  const pagination = productsData?.data.data.pagination
  const categories = categoriesData?.data.data || []

  // Get current category name for page title
  const currentCategory = filters.category ? categories.find((cat) => cat._id === filters.category) : null

  return (
    <div className='bg-[#f5f5f5] py-6 dark:bg-slate-900'>
      <SEO
        title={currentCategory ? `${currentCategory.name}` : t('allProducts')}
        description={t('allProductsMeta')}
        jsonLd={[
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
              {
                '@type': 'ListItem',
                position: 2,
                name: currentCategory?.name ?? 'Tất cả sản phẩm',
                ...(currentCategory ? { item: `${SITE_URL}/products?category=${currentCategory._id}` } : {})
              }
            ]
          },
          ...(products.length > 0
            ? [
                {
                  '@type': 'ItemList',
                  itemListElement: products.map((p, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    name: p.name,
                    url: `${SITE_URL}/${encodeURIComponent(p.name.replace(/\s/g, '-'))}-i-${p._id}`
                  }))
                }
              ]
            : [])
        ]}
      />

      <div className='container'>
        {/* Loading indicator khi đang fetch data mới (không phải lần đầu load) */}
        <AnimatePresence>
          {isFetching && productsData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className='fixed top-20 right-4 z-50 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800'
            >
              <div className='flex items-center space-x-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-orange'></div>
                <span className='text-sm text-gray-600 dark:text-gray-300'>{t('updating')}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {products.length > 0 && (
          <div className='grid grid-cols-12 gap-6'>
            {/* Desktop: AsideFilter - ẩn trên mobile */}
            <div className='hidden md:col-span-3 md:block'>
              <AsideFilter categories={categories} />
            </div>

            <div className='col-span-12 md:col-span-9'>
              {/* Mobile Filter Button - chỉ hiện trên mobile */}
              <div className='mb-4 md:hidden'>
                <Button
                  variant='secondary'
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className='flex w-full items-center justify-center gap-2 rounded-xs shadow-xs focus:ring-2 focus:ring-orange focus:ring-offset-2 focus:outline-hidden'
                  ariaLabel={t('filter.openFilter')}
                >
                  <svg
                    enableBackground='new 0 0 15 15'
                    viewBox='0 0 15 15'
                    className='h-4 w-4 fill-current stroke-current'
                  >
                    <g>
                      <polyline
                        fill='none'
                        points='5.5 13.2 5.5 5.8 1.5 1.2 13.5 1.2 9.5 5.8 9.5 10.2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeMiterlimit={10}
                      />
                    </g>
                  </svg>
                  <span>{t('filter.button')}</span>
                  {/* Badge hiển thị số filter đang active */}
                  {(filters.category || filters.price_min || filters.price_max || filters.rating_filter) && (
                    <span className='ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange text-xs text-white'>
                      {
                        [filters.category, filters.price_min || filters.price_max, filters.rating_filter].filter(
                          Boolean
                        ).length
                      }
                    </span>
                  )}
                </Button>
              </div>

              <SortProductList
                pageSize={pagination?.page_size || 0}
                viewMode={viewMode}
                onViewChange={changeViewMode}
              />
              <AnimatePresence mode='wait'>
                {viewMode === 'grid' ? (
                  <motion.div
                    key='grid-view'
                    className='mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    aria-live='polite'
                    aria-busy={isFetching}
                    variants={containerVariants}
                    initial={isMobile ? false : 'hidden'}
                    animate={isMobile ? undefined : 'visible'}
                    exit={{ opacity: 0 }}
                  >
                    {products.map((product) => (
                      <div
                        className='col-span-1 transition-transform duration-200 hover:-translate-y-0.25 hover:shadow-md dark:hover:shadow-slate-900/50'
                        key={product._id}
                      >
                        <Product product={product} />
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key='list-view'
                    className='mt-6 space-y-3'
                    aria-live='polite'
                    aria-busy={isFetching}
                    variants={containerVariants}
                    initial={isMobile ? false : 'hidden'}
                    animate={isMobile ? undefined : 'visible'}
                    exit={{ opacity: 0 }}
                  >
                    {products.map((product) => (
                      <div
                        className='transition-transform duration-200 hover:-translate-y-0.25 hover:shadow-md dark:hover:shadow-slate-900/50'
                        key={product._id}
                      >
                        <ProductListItem product={product} />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {pagination && <Pagination pageSize={pagination.page_size} basePath={path.products} />}
            </div>
          </div>
        )}

        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          categories={categories}
        />

        {/* Empty state - Enhanced with SearchNoResults when there's a search query */}
        {products.length === 0 &&
          !isLoading &&
          !isFetching &&
          (filters.name ? (
            <SearchNoResults
              searchTerm={filters.name}
              onPopularSearch={(term) => {
                setFilters({ name: term, page: 1 })
              }}
            />
          ) : (
            <div className='py-16 text-center'>
              <div className='mx-auto mb-4 h-24 w-24'>
                <svg
                  className='h-full w-full text-gray-300 dark:text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1}
                    d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
                  />
                </svg>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-gray-600 dark:text-gray-300'>{t('empty.noProducts')}</h3>
              <p className='mb-6 text-gray-500 dark:text-gray-400'>{t('empty.adjustFilters')}</p>
              <Button
                variant='primary'
                onClick={() => {
                  navigate({
                    pathname: path.home,
                    search: ''
                  })
                }}
                className='rounded-xs px-6 py-3'
              >
                {t('empty.viewAll')}
              </Button>
            </div>
          ))}
      </div>
    </div>
  )
}

export default ProductList
