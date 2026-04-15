import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getEstimatedDeliveryDate } from 'src/utils/date'
import { ChevronRightIcon, DeliveryTruckIcon } from 'src/components/Icons'
import ShippingMethodModal from 'src/components/ShippingMethodModal'

interface ShippingInfoProps {
  location: string
}

const DEFAULT_DELIVERY_DAYS = '3-5'

const ShippingInfo = ({ location }: ShippingInfoProps) => {
  const { t } = useTranslation('product')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Estimated delivery: 3-5 days from now using existing utility
  const deliveryRange = getEstimatedDeliveryDate(DEFAULT_DELIVERY_DAYS)

  return (
    <>
      <div
        className="flex cursor-pointer items-start gap-3 border-t border-gray-100 py-4 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange dark:border-slate-700 dark:hover:bg-slate-700/50"
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={t('shipping.label')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsModalOpen(true)
          }
        }}
      >
        <span className="w-28 shrink-0 pt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {t('shipping.label')}
        </span>
        <div className="flex items-start gap-1">
          <div className="flex flex-col gap-2">
            {/* Free shipping row - Shopee style with truck icon + green badge */}
            <div className="flex items-center gap-2">
              <DeliveryTruckIcon className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                {t('shipping.freeShipping')}
              </span>
            </div>
            {/* Shipping to + Estimated delivery - compact Shopee style */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <span>
                {t('shipping.deliverFrom', { location: location || t('shipping.defaultLocation') })}
              </span>
              <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">
                |
              </span>
              <span>{t('shipping.estimatedDelivery', { date: deliveryRange })}</span>
            </div>
          </div>
          {/* Chevron icon - now next to content */}
          <ChevronRightIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      <ShippingMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        location={location}
      />
    </>
  )
}

export default ShippingInfo
