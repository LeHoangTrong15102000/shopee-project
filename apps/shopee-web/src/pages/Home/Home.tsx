import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import HeroBanner from 'src/components/HeroBanner'
import { FlashSaleTimer } from 'src/components/FlashSale'
import OptimizedImage from 'src/components/OptimizedImage'
import SEO from 'src/components/SEO'
import { SITE_URL } from 'src/components/SEO'
import categoryApi from 'src/apis/category.api'
import productApi from 'src/apis/product.api'
import path from 'src/constant/path'
import { generateNameId } from 'src/utils/utils'
import useFlashSale from 'src/hooks/useFlashSale'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
}

const Home = () => {
  const { t } = useTranslation('home')
  // Lấy danh mục sản phẩm
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getCategories(),
    staleTime: 5 * 60 * 1000 // Cache 5 phút
  })

  // Lấy sản phẩm nổi bật (top 20)
  const { data: featuredProductsData } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => productApi.getProducts({ page: 1, limit: 20, sort_by: 'sold', order: 'desc' }),
    staleTime: 5 * 60 * 1000
  })

  // Lấy sản phẩm mới (top 20)
  const { data: newProductsData } = useQuery({
    queryKey: ['newProducts'],
    queryFn: () => productApi.getProducts({ page: 1, limit: 20, sort_by: 'createdAt', order: 'desc' }),
    staleTime: 5 * 60 * 1000
  })

  // WebSocket: Real-time flash sale data (use undefined for demo, replace with actual sale ID when available)
  const activeSaleId = undefined // TODO: Replace with actual flash sale ID from API when available
  const {
    remainingSeconds,
    products: flashSaleProducts,
    isActive: _isActive,
    isEnded,
    isConnectedToServer
  } = useFlashSale(activeSaleId)

  const categories = categoriesData?.data.data || []
  const featuredProducts = featuredProductsData?.data.data.products || []
  const newProducts = newProductsData?.data.data.products || []

  return (
    <div className='bg-gray-50 dark:bg-slate-900'>
      <SEO
        title={t('meta.title')}
        description={t('meta.description')}
        jsonLd={[
          {
            '@type': 'WebSite',
            name: 'Shopee Clone',
            url: SITE_URL,
            potentialAction: {
              '@type': 'SearchAction',
              target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/products?name={search_term_string}` },
              'query-input': 'required name=search_term_string'
            }
          }
        ]}
      />

      {/* Hero Banner */}
      <div className='bg-white dark:bg-slate-800'>
        <div className='container py-6'>
          <HeroBanner />
        </div>
      </div>

      {/* Category Section */}
      <motion.div
        className='mt-4 bg-white dark:bg-slate-800'
        initial='hidden'
        animate='visible'
        variants={sectionVariants}
      >
        <div className='container py-6'>
          <div className='mb-6'>
            <h2 className='mb-2 text-lg font-semibold text-gray-800 sm:text-xl dark:text-white'>
              {t('categories.title')}
            </h2>
            <p className='text-gray-600 dark:text-gray-300'>{t('categories.subtitle')}</p>
          </div>
          <motion.div
            className='grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {categories.slice(0, 16).map((category) => (
              <motion.div
                key={category._id}
                variants={itemVariants}
                className='transition-transform duration-300 hover:scale-105'
              >
                <Link
                  to={`${path.products}?category=${category._id}`}
                  className='group flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 transition-all duration-300 hover:border-orange hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-500 dark:hover:shadow-slate-900/50'
                >
                  <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-red-500 text-lg font-bold text-white shadow-xs shadow-orange-500/20 transition-transform duration-300 group-hover:scale-110 dark:from-orange-500 dark:to-red-500'>
                    {category.name.charAt(0)}
                  </div>
                  <span className='text-center text-sm font-medium text-gray-700 group-hover:text-orange dark:text-gray-300 dark:group-hover:text-orange-400'>
                    {category.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Flash Sale Section - Giả lập */}
      <motion.div
        className='mt-4 bg-white dark:bg-slate-800'
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-100px' }}
        variants={sectionVariants}
      >
        <div className='container py-6'>
          <div className='mb-6 flex flex-wrap items-center justify-between gap-2'>
            <div className='flex items-center'>
              <h2 className='mr-4 text-base font-semibold text-orange sm:text-xl'>FLASH SALE</h2>
              <FlashSaleTimer
                serverRemainingSeconds={remainingSeconds}
                isServerSynced={isConnectedToServer}
                products={flashSaleProducts}
                isEnded={isEnded}
              />
            </div>
            <Link
              to={`${path.products}?sort_by=sold&order=desc`}
              className='font-medium text-orange hover:text-[#d73527]'
            >
              {t('viewAll')}
            </Link>
          </div>
          <motion.div
            className='grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {featuredProducts.slice(0, 6).map((product) => (
              <motion.div
                key={product._id}
                variants={itemVariants}
                className='transition-transform duration-300 hover:-translate-y-[5px]'
              >
                <Link
                  to={`${path.home}${generateNameId({ name: product.name, id: product._id })}`}
                  className='group block overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:shadow-slate-900/50'
                >
                  <div className='relative overflow-hidden'>
                    <OptimizedImage
                      src={product.image}
                      alt={product.name}
                      className='h-40 w-full transition-transform duration-300 group-hover:scale-105'
                      loading='lazy'
                      showSkeleton={true}
                    />
                    <div className='absolute top-2 left-2 rounded-sm bg-orange px-2 py-1 text-xs text-white'>
                      -
                      {Math.round(
                        ((product.price_before_discount - product.price) / product.price_before_discount) * 100
                      )}
                      %
                    </div>
                  </div>
                  <div className='p-3'>
                    <h3 className='mb-2 line-clamp-2 text-sm font-medium text-gray-800 group-hover:text-orange dark:text-gray-100 dark:group-hover:text-orange-400'>
                      {product.name}
                    </h3>
                    <div className='flex items-center justify-between'>
                      <span className='font-bold text-orange'>₫{product.price.toLocaleString()}</span>
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        {t('sold', { count: product.sold })}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Sản phẩm mới Section */}
      <motion.div
        className='mt-4 bg-white dark:bg-slate-800'
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-100px' }}
        variants={sectionVariants}
      >
        <div className='container py-6'>
          <div className='mb-6 flex items-center justify-between'>
            <div>
              <h2 className='mb-2 text-lg font-semibold text-gray-800 sm:text-xl dark:text-white'>
                {t('newProducts.title')}
              </h2>
              <p className='text-gray-600 dark:text-gray-300'>{t('newProducts.subtitle')}</p>
            </div>
            <Link
              to={`${path.products}?sort_by=createdAt&order=desc`}
              className='font-medium text-orange hover:text-[#d73527] dark:hover:text-orange-400'
            >
              {t('viewAll')}
            </Link>
          </div>
          <motion.div
            className='grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {newProducts.slice(0, 12).map((product) => (
              <motion.div
                key={product._id}
                variants={itemVariants}
                className='transition-transform duration-300 hover:-translate-y-[5px]'
              >
                <Link
                  to={`${path.home}${generateNameId({ name: product.name, id: product._id })}`}
                  className='group block overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:shadow-slate-900/50'
                >
                  <div className='relative overflow-hidden'>
                    <OptimizedImage
                      src={product.image}
                      alt={product.name}
                      className='h-40 w-full transition-transform duration-300 group-hover:scale-105'
                      loading='lazy'
                      showSkeleton={true}
                    />
                    <div className='absolute top-2 right-2 rounded-sm bg-green-500 px-2 py-1 text-xs text-white'>
                      {t('badge.new')}
                    </div>
                  </div>
                  <div className='p-3'>
                    <h3 className='mb-2 line-clamp-2 text-sm font-medium text-gray-800 group-hover:text-orange dark:text-gray-100 dark:group-hover:text-orange-400'>
                      {product.name}
                    </h3>
                    <div className='flex items-center justify-between'>
                      <span className='font-bold text-orange'>₫{product.price.toLocaleString()}</span>
                      <div className='flex items-center'>
                        <svg className='mr-1 h-3 w-3 text-yellow-400' fill='currentColor' viewBox='0 0 20 20'>
                          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                        <span className='text-xs text-gray-500 dark:text-gray-400'>{product.rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Call to Action Section */}
      <motion.div
        className='mt-4 bg-linear-to-r from-[#ee4d2d] to-[#f53d2d]'
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-100px' }}
        variants={sectionVariants}
      >
        <div className='container py-12'>
          <div className='text-center text-white'>
            <h2 className='mb-4 text-2xl font-bold md:text-3xl'>{t('cta.title')}</h2>
            <p className='mb-6 text-lg opacity-90'>{t('cta.subtitle')}</p>
            <Link
              to={`${path.products}?sort_by=sold&order=desc`}
              className='inline-flex transform items-center rounded-full bg-white px-8 py-3 font-semibold text-orange transition-all duration-300 hover:scale-105 hover:bg-gray-100'
            >
              <span>{t('cta.shopNow')}</span>
              <svg className='ml-2 h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
              </svg>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Home
