import { useTranslation } from 'react-i18next'
import OnlineIndicator from 'src/components/OnlineIndicator'
import ShopMetrics from './ShopMetrics'

interface ShopInfoProps {
  categoryName?: string
  location?: string
  rating: number
  isSellerOnline: boolean
  sellerLastSeen: string | null
  shopId?: string
}

const ShopInfo = ({
  categoryName,
  location,
  rating,
  isSellerOnline,
  sellerLastSeen,
  shopId,
}: ShopInfoProps) => {
  const { t } = useTranslation('product')

  return (
    <div className="rounded-sm bg-white p-4 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Left: Avatar + Name + Online + Buttons */}
        <div className="flex items-center gap-4">
          {/* Shop Avatar */}
          <div className="shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-orange bg-gray-200 dark:bg-slate-700">
              <svg
                aria-hidden="true"
                className="h-10 w-10 text-gray-400 dark:text-gray-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          {/* Shop Info + Buttons */}
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {t('shop.name')} {categoryName || t('shop.defaultName')}
            </h2>
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{location || t('shipping.defaultLocation')}</span>
            </div>
            <OnlineIndicator isOnline={isSellerOnline} lastSeen={sellerLastSeen} size="sm" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex min-h-11 items-center gap-1.5 rounded-sm border border-orange px-4 py-1.5 text-sm font-medium text-orange hover:bg-orange/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-400/10"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {t('shop.chatNow')}
              </button>
              <button
                type="button"
                className="min-h-11 rounded-sm border border-orange px-4 py-1.5 text-sm font-medium text-orange hover:bg-orange/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-400/10"
              >
                {t('shop.viewShop')}
              </button>
            </div>
          </div>
        </div>
        {/* Vertical Divider (desktop) */}
        <div className="hidden h-20 w-px bg-gray-200 md:block dark:bg-slate-600" />
        {/* Right: Shop Metrics */}
        <div className="flex-1">
          <ShopMetrics rating={rating} shopId={shopId} />
        </div>
      </div>
    </div>
  )
}

export default ShopInfo
