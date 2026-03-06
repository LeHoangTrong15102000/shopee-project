import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Fragment, useState, useMemo } from 'react'
import purchaseApi from 'src/apis/purchases.api'
import { OrderSearchFilter } from 'src/components/OrderSearchFilter'
import ProductReviewModal from 'src/components/ProductReviewModal'
import { usePurchaseStatus } from 'src/hooks/nuqs'
import { useOrderFilter } from 'src/hooks/useOrderFilter'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { useTranslation } from 'react-i18next'
import SEO from 'src/components/SEO'
import { staggerContainer } from 'src/styles/animations'
import { PurchaseListStatus, Purchase } from 'src/types/purchases.type'
import { PurchaseTabBar, PurchaseItem } from './components'

const HistoryPurchases = () => {
  const { t } = useTranslation('user')
  const [status, setStatus] = usePurchaseStatus() // nuqs: typed integer, default 0 (all)
  const reducedMotion = useReducedMotion()

  // Order filter hook - manages all filter state
  const { filters, setSearchQuery, setDateRange, setPriceRange, clearAllFilters, activeFilterCount, filterPurchases } =
    useOrderFilter()

  // Review modal state
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  // Order tracking expanded state - track which orders have expanded timeline
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set())

  const { data: purchasesInCartData } = useQuery({
    queryKey: ['purchases', { status }],
    queryFn: () => purchaseApi.getPurchases({ status: status as PurchaseListStatus }) // Do thằng status có kiểu là PurListStatus
  })

  const purchasesInCart = purchasesInCartData?.data.data // PurchasesInCart là một cái Purchase[]

  // Filter purchases based on all filters (search, date range, price range)
  const filteredPurchases = useMemo(() => {
    if (!purchasesInCart) return []
    return filterPurchases(purchasesInCart)
  }, [purchasesInCart, filterPurchases])

  // Check if filters are active (for showing different empty state)
  const hasActiveFilters = activeFilterCount > 0

  // Handle review button click
  const handleReviewClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setIsReviewModalOpen(true)
  }

  // Close review modal
  const closeReviewModal = () => {
    setIsReviewModalOpen(false)
    setSelectedPurchase(null)
  }

  // Toggle order tracking expansion
  const toggleOrderTracking = (orderId: string) => {
    setExpandedOrderIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  return (
    <Fragment>
      <SEO title='Đơn mua' noindex />
      {/* Tabs Link */}
      <PurchaseTabBar status={status} onStatusChange={setStatus} />

      {/* Order Search Filter */}
      <OrderSearchFilter
        searchQuery={filters.searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={filters.dateRange}
        onDateRangeChange={setDateRange}
        priceRange={filters.priceRange}
        onPriceRangeChange={setPriceRange}
        onClearAll={clearAllFilters}
        activeFilterCount={activeFilterCount}
        totalResults={filteredPurchases.length}
        className='mt-4'
      />

      {/* Cho overflow-x-auto để cho có cái thanh ngang */}
      <div className='overflow-x-auto'>
        <div>
          {/* Phần body của tabs Link */}
          <AnimatePresence mode='wait'>
            {filteredPurchases.length > 0 ? (
              <motion.div
                key='purchase-list'
                variants={reducedMotion ? undefined : staggerContainer()}
                initial='hidden'
                animate='visible'
              >
                {filteredPurchases.map((purchase) => (
                  <PurchaseItem
                    key={purchase._id}
                    purchase={purchase}
                    reducedMotion={reducedMotion}
                    isExpanded={expandedOrderIds.has(purchase._id)}
                    onToggleTracking={toggleOrderTracking}
                    onReviewClick={handleReviewClick}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key='empty-state'
                className='mt-4 flex flex-col items-center justify-center rounded-xs bg-white p-12 text-black/60 shadow-xs dark:bg-slate-800 dark:text-gray-400'
                initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {hasActiveFilters ? (
                  <>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='mb-3 h-12 w-12 text-gray-300 dark:text-gray-500'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z'
                      />
                    </svg>
                    <span className='text-sm font-medium dark:text-gray-300'>{t('history.noMatchingOrders')}</span>
                    <span className='mt-1 text-xs text-gray-400'>{t('history.adjustFilters')}</span>
                    <button
                      type='button'
                      onClick={clearAllFilters}
                      className='mt-3 text-sm font-medium text-[#ee4d2d] underline transition-colors hover:text-[#d73211] dark:text-orange-400 dark:hover:text-orange-300'
                    >
                      {t('history.clearAllFilters')}
                    </button>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='mb-3 h-12 w-12 text-gray-300 dark:text-gray-500'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z'
                      />
                    </svg>
                    <span className='text-sm dark:text-gray-300'>{t('history.noOrders')}</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Review Modal */}
      {selectedPurchase && (
        <ProductReviewModal isOpen={isReviewModalOpen} onClose={closeReviewModal} purchase={selectedPurchase} />
      )}
    </Fragment>
  )
}

export default HistoryPurchases
