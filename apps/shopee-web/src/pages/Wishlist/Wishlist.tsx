import { motion } from 'framer-motion'
import { Fragment, useState } from 'react'
import SEO from 'src/components/SEO'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import WishlistPriceAlert from 'src/components/WishlistPriceAlert'
import Button from 'src/components/Button'
import path from 'src/constant/path'
import { useIsMobile } from 'src/hooks/useIsMobile'
import { formatCurrency } from 'src/utils/utils'
import { useWishlist } from './useWishlist'
import { containerVariants, fadeInUp, itemVariants } from './wishlist.constants'
import {
  categoryIconComponents,
  IconBell,
  IconCube,
  IconFire,
  IconFolder,
  IconHeart,
  IconMagnifyingGlass,
  IconSparkles,
  IconStar,
  IconTarget,
  IconTrendingDown,
  IconTrendingUp
} from './components/WishlistIcons'
import WishlistCard from './components/WishlistCard'
import WishlistStats from './components/WishlistStats'
import WishlistFilters from './components/WishlistFilters'
import WishlistSkeletonLoader from './components/WishlistSkeletonLoader'

export default function Wishlist() {
  const { t } = useTranslation('wishlist')
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeSort, setActiveSort] = useState('newest')
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const isMobile = useIsMobile()

  const {
    allWishlistItems,
    wishlistItems,
    productIds,
    totalValue,
    totalSavings,
    insights,
    isLoading,
    isRecentlyAdded,
    isTrending,
    getStockStatus,
    getDiscountPercent,
    removeMutation,
    addToCartMutation
  } = useWishlist(activeFilter, activeSort)

  const activeContainerVariants = isMobile ? undefined : containerVariants
  const activeFadeInUp = isMobile ? undefined : fadeInUp

  if (isLoading) {
    return <WishlistSkeletonLoader />
  }

  return (
    <div className='border-b-4 border-b-[#ee4d2d] bg-neutral-100 py-16 dark:bg-slate-900'>
      <SEO title={t('pageTitle')} description={t('pageDescription')} noindex />

      <div className='container'>
        {allWishlistItems.length > 0 ? (
          <Fragment>
            <WishlistPriceAlert productIds={productIds} />

            {/* Wishlist Hero Banner */}
            <motion.div
              variants={activeFadeInUp}
              initial={isMobile ? false : 'hidden'}
              animate={isMobile ? undefined : 'visible'}
              className='relative mb-6 overflow-hidden rounded-xl bg-linear-to-r from-[#ee4d2d] via-[#ff6b4a] to-[#ff8c6b] shadow-lg dark:from-orange-700 dark:via-orange-600 dark:to-orange-500 dark:shadow-slate-900/50'
            >
              <div className='pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl' />
              <div className='pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5 blur-2xl' />
              <div className='relative z-10 flex flex-col items-center gap-4 px-6 py-7 sm:flex-row sm:justify-between sm:px-8 sm:py-8'>
                <div className='flex items-center gap-4 text-center sm:text-left'>
                  <div className='hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs sm:flex'>
                    <IconHeart className='h-7 w-7 text-white' />
                  </div>
                  <div className='text-white'>
                    <div className='mb-1 flex items-center justify-center gap-2 sm:justify-start'>
                      <IconSparkles className='h-4 w-4 text-yellow-200' />
                      <span className='text-[11px] font-semibold tracking-wider text-white/80 uppercase'>
                        {t('headerLabel')}
                      </span>
                    </div>
                    <h2 className='text-xl font-bold drop-shadow-xs sm:text-2xl'>
                      {t('headerTitle', { count: allWishlistItems.length })}
                    </h2>
                    <p className='mt-1 max-w-md text-xs text-white/80 sm:text-sm'>{t('headerSubtitle')}</p>
                  </div>
                </div>
                <div className='hidden items-center gap-3 md:flex'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-xs'>
                    <IconStar className='h-5 w-5 text-yellow-200' />
                  </div>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-xs'>
                    <IconBell className='h-5 w-5 text-white/90' />
                  </div>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-xs'>
                    <IconTrendingDown className='h-5 w-5 text-emerald-200' />
                  </div>
                </div>
              </div>
            </motion.div>

            <WishlistStats
              itemCount={allWishlistItems.length}
              totalValue={totalValue}
              totalSavings={totalSavings}
              avgDiscount={insights?.avgDiscount || 0}
              itemVariants={itemVariants}
              containerVariants={activeContainerVariants}
              isMobile={isMobile}
            />

            {/* Wishlist Insights Banner */}
            {insights && (
              <motion.div
                variants={activeFadeInUp}
                initial={isMobile ? false : 'hidden'}
                animate={isMobile ? undefined : 'visible'}
                className='mb-6 rounded-xl border border-purple-200 bg-linear-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 p-4 dark:border-purple-800/50 dark:from-violet-500/20 dark:via-purple-500/20 dark:to-fuchsia-500/20'
              >
                <div className='flex flex-wrap items-center gap-4 text-sm'>
                  <span className='inline-flex items-center gap-1.5 font-medium text-purple-700 dark:text-purple-300'>
                    <IconTrendingUp className='h-4 w-4' /> {t('insights')}
                  </span>
                  <span className='inline-flex items-center gap-1 text-gray-600 dark:text-gray-300'>
                    {t('topCategory')}{' '}
                    <span className='inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400'>
                      {(() => {
                        const CatIcon = categoryIconComponents[insights.topCategory] || IconCube
                        return <CatIcon className='h-3.5 w-3.5' />
                      })()}{' '}
                      {insights.topCategory}
                    </span>{' '}
                    ({insights.topCategoryCount} SP)
                  </span>
                  <span className='hidden text-gray-300 sm:inline dark:text-gray-600'>|</span>
                  {insights.priceDropCount > 0 && (
                    <span className='inline-flex items-center gap-1 font-semibold text-green-600 dark:text-green-400'>
                      <IconFire className='h-3.5 w-3.5' /> {t('priceDropCount', { count: insights.priceDropCount })}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            <WishlistFilters
              activeFilter={activeFilter}
              activeSort={activeSort}
              showSortDropdown={showSortDropdown}
              onFilterChange={setActiveFilter}
              onSortChange={setActiveSort}
              onToggleSortDropdown={() => setShowSortDropdown(!showSortDropdown)}
            />

            {/* Results count */}
            {activeFilter !== 'all' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='mb-4 text-sm text-gray-500 dark:text-gray-400'
              >
                {t('showingResults', { shown: wishlistItems.length, total: allWishlistItems.length })}
              </motion.div>
            )}

            {/* Product Card Grid */}
            <motion.div
              variants={activeContainerVariants}
              initial={isMobile ? false : 'hidden'}
              animate={isMobile ? undefined : 'visible'}
              key={activeFilter + activeSort}
              className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            >
              {wishlistItems.map((item) => (
                <WishlistCard
                  key={item._id}
                  item={item}
                  hoveredCardId={hoveredCardId}
                  onMouseEnter={() => setHoveredCardId(item._id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  onRemove={() => removeMutation.mutate(item.product._id)}
                  onAddToCart={() => addToCartMutation.mutate(item.product._id)}
                  isRecentlyAdded={isRecentlyAdded}
                  isTrending={isTrending}
                  getStockStatus={getStockStatus}
                  getDiscountPercent={getDiscountPercent}
                  itemVariants={itemVariants}
                />
              ))}
            </motion.div>

            {/* Empty filter result */}
            {wishlistItems.length === 0 && activeFilter !== 'all' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='py-12 text-center'>
                <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500'>
                  <IconMagnifyingGlass className='h-7 w-7' />
                </div>
                <p className='text-gray-500 dark:text-gray-400'>{t('noFilterResults')}</p>
                <Button
                  variant='text'
                  animated={false}
                  onClick={() => setActiveFilter('all')}
                  className='mt-3 cursor-pointer rounded-sm text-sm text-[#ee4d2d] hover:underline focus:ring-2 focus:ring-orange-500 focus:outline-hidden dark:text-orange-400 dark:focus:ring-orange-400'
                >
                  {t('viewAll')}
                </Button>
              </motion.div>
            )}

            {/* Two-column banners */}
            <motion.div
              variants={activeFadeInUp}
              initial={isMobile ? false : 'hidden'}
              animate={isMobile ? undefined : 'visible'}
              className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'
            >
              <div className='overflow-hidden rounded-xl bg-linear-to-br from-[#ee4d2d] to-[#ff6b4a] p-5 shadow-lg dark:from-orange-600 dark:to-orange-500 dark:shadow-slate-900/50'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-white'>
                    <IconBell className='h-6 w-6' />
                  </div>
                  <div className='text-white'>
                    <h3 className='text-sm font-semibold'>{t('priceTracking.title')}</h3>
                    <p className='mt-0.5 text-xs text-white/80'>{t('priceTracking.subtitle')}</p>
                  </div>
                </div>
                <Button
                  animated={false}
                  className='mt-3 cursor-pointer rounded-full bg-white px-5 py-2 text-xs font-semibold text-[#ee4d2d] transition-all duration-200 hover:bg-white/90 hover:shadow-md focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-orange-500 focus:outline-hidden dark:text-orange-600'
                >
                  {t('priceTracking.enable')}
                </Button>
              </div>
              <div className='overflow-hidden rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 p-5 shadow-lg dark:from-emerald-600 dark:to-teal-600 dark:shadow-slate-900/50'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-white'>
                    <IconTarget className='h-6 w-6' />
                  </div>
                  <div className='text-white'>
                    <h3 className='text-sm font-semibold'>{t('savingsGoal.title')}</h3>
                    <p className='mt-0.5 text-xs text-white/80'>
                      {t('savingsGoal.subtitle', {
                        amount: formatCurrency(totalSavings),
                        count: allWishlistItems.length
                      })}
                    </p>
                  </div>
                </div>
                <div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20'>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalSavings / (totalValue + totalSavings || 1)) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className='h-full rounded-full bg-white/80'
                  />
                </div>
                <p className='mt-1 text-[10px] text-white/70'>
                  {t('savingsGoal.percent', {
                    percent:
                      totalValue + totalSavings > 0 ? Math.round((totalSavings / (totalValue + totalSavings)) * 100) : 0
                  })}
                </p>
              </div>
            </motion.div>

            {/* Category breakdown mini cards */}
            <motion.div
              variants={activeFadeInUp}
              initial={isMobile ? false : 'hidden'}
              animate={isMobile ? undefined : 'visible'}
              className='mt-6'
            >
              <h3 className='mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                <IconFolder className='h-4 w-4' /> {t('categoryBreakdown')}
              </h3>
              <div className='scrollbar-hide flex gap-2 overflow-x-auto pb-2'>
                {Object.entries(
                  allWishlistItems.reduce<Record<string, number>>((acc, item) => {
                    const cat =
                      item.product.category?.name ||
                      (item as { mockCategory?: string }).mockCategory ||
                      t('categoryOther')
                    acc[cat] = (acc[cat] || 0) + 1
                    return acc
                  }, {})
                )
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => {
                    const CatIcon = categoryIconComponents[cat] || IconCube
                    return (
                      <div
                        key={cat}
                        className='flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-800'
                      >
                        <span className='text-gray-500 dark:text-gray-400'>
                          <CatIcon className='h-4 w-4' />
                        </span>
                        <span className='font-medium text-gray-700 dark:text-gray-300'>{cat}</span>
                        <span className='rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-slate-700 dark:text-gray-400'>
                          {count}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </motion.div>
          </Fragment>
        ) : (
          /* Enhanced Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='relative overflow-hidden rounded-xl border border-gray-100 bg-white p-12 text-center shadow-xs md:p-16 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50'
          >
            <motion.div
              animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className='absolute top-10 left-10 h-3 w-3 rounded-full bg-orange-300 dark:bg-orange-500/50'
            />
            <motion.div
              animate={{ y: [0, 10, 0], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className='absolute top-20 right-16 h-2 w-2 rounded-full bg-pink-300 dark:bg-pink-500/50'
            />
            <motion.div
              animate={{ y: [0, -8, 0], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className='absolute bottom-16 left-20 h-2.5 w-2.5 rounded-full bg-blue-300 dark:bg-blue-500/50'
            />
            <motion.div
              animate={{ x: [0, 8, 0], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              className='absolute top-16 right-1/3 h-2 w-2 rounded-full bg-purple-300 dark:bg-purple-500/50'
            />

            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className='mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-linear-to-br from-orange-50 to-red-50 shadow-inner md:h-40 md:w-40 dark:from-slate-700 dark:to-slate-600'
            >
              <span className='text-orange-400 dark:text-orange-500'>
                <IconHeart className='h-16 w-16 md:h-20 md:w-20' />
              </span>
            </motion.div>

            <h3 className='mb-2 text-xl font-semibold text-gray-800 md:text-2xl dark:text-gray-100'>
              {t('empty.title')}
            </h3>
            <p className='mx-auto mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400'>{t('empty.subtitle')}</p>
            <Link
              to={path.home}
              className='inline-flex cursor-pointer items-center gap-2 rounded-lg bg-linear-to-r from-[#ee4d2d] to-[#ff6b4a] px-8 py-3 font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-hidden dark:from-orange-500 dark:to-orange-400 dark:focus:ring-orange-400'
            >
              <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
                />
              </svg>
              {t('empty.shopNow')}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
