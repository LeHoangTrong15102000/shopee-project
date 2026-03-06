import SEO from 'src/components/SEO'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import ComparisonTable from 'src/components/ComparisonTable'
import RecentlyViewed from 'src/components/RecentlyViewed'
import { useProductComparison } from 'src/hooks/useProductComparison'
import { useRecentlyViewed } from 'src/hooks/useRecentlyViewed'
import { useOptimisticAddToCart } from 'src/hooks/optimistic'
import { Product } from 'src/types/product.type'
import path from 'src/constant/path'

const Compare = () => {
  const { t } = useTranslation('compare')
  const { compareList } = useProductComparison()
  const { recentlyViewed, removeProduct, clearAll } = useRecentlyViewed()
  const addToCartMutation = useOptimisticAddToCart()

  const handleAddToCart = (product: Product) => {
    addToCartMutation.mutate({
      product_id: product._id,
      buy_count: 1
    })
  }

  return (
    <div className='min-h-screen bg-gray-100 py-4 sm:py-6 dark:bg-slate-900'>
      <SEO title={t('pageTitle')} description={t('pageDescription')} />

      <div className='container'>
        {/* Header */}
        <div className='mb-4 rounded-lg bg-white p-3 shadow-xs sm:mb-6 sm:p-4 md:p-6 dark:bg-slate-800 dark:shadow-slate-900/50'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-lg font-bold text-gray-800 sm:text-xl md:text-2xl dark:text-gray-100'>
                {t('title')}
              </h1>
              <p className='mt-1 text-sm text-gray-500 sm:text-base dark:text-gray-400'>
                {compareList.length > 0 ? t('comparing', { count: compareList.length }) : t('addToCompare')}
              </p>
            </div>
            {compareList.length > 0 && (
              <Link
                to={path.products}
                className='rounded-sm border border-orange px-3 py-1.5 text-sm text-orange transition-colors hover:bg-orange/5 sm:px-4 sm:py-2 sm:text-base dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-400/10'
              >
                {t('addProduct')}
              </Link>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        <div className='mb-4 rounded-lg bg-white p-3 shadow-xs sm:mb-6 sm:p-4 md:p-6 dark:bg-slate-800 dark:shadow-slate-900/50'>
          <ComparisonTable onAddToCart={handleAddToCart} />
        </div>

        {/* Recently Viewed Products */}
        <div className='rounded-lg bg-white p-3 shadow-xs sm:p-4 md:p-6 dark:bg-slate-800 dark:shadow-slate-900/50'>
          <h2 className='mb-4 text-base font-semibold text-gray-800 sm:text-lg dark:text-gray-100'>
            {t('recentlyViewed')}
          </h2>
          <RecentlyViewed products={recentlyViewed} maxItems={10} onRemove={removeProduct} onClearAll={clearAll} />
        </div>
      </div>
    </div>
  )
}

export default Compare
