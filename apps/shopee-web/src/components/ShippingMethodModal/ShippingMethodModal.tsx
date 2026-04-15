import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import BaseModal from 'src/components/BaseModal/BaseModal'
import checkoutApi from 'src/apis/checkout.api'
import { formatCurrency } from 'src/utils/utils'
import { getShopeeDeliveryRange } from 'src/utils/date'
import { ShippingMethod } from 'src/types/checkout.type'

// Shopee official truck icon URL - only for instant delivery
const SHOPEE_TRUCK_ICON_URL =
  'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/productdetailspage/6b56a09bbc0bcca75e85.svg'

// Shopee teal color for free shipping text
const SHOPEE_TEAL = '#219787'

interface ShippingMethodModalProps {
  isOpen: boolean
  onClose: () => void
  location?: string
}

const ShippingMethodModal = ({ isOpen, onClose, location }: ShippingMethodModalProps) => {
  const { t } = useTranslation('shipping')
  const { t: tProduct } = useTranslation('product')

  const {
    data: methodsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const res = await checkoutApi.getShippingMethods()
      return res.data.data
    },
    enabled: isOpen,
  })

  const methods = methodsData || []
  const hasMethods = !isLoading && !isError && methods.length > 0

  // Render delivery time badge for instant delivery - Shopee style
  // SVG gốc Shopee: 43x22px, đã có nền teal + truck icon tích hợp sẵn
  // Badge text nối tiếp bên phải, cùng chiều cao, tạo badge liền mạch
  const renderDeliveryBadge = (method: ShippingMethod) => {
    if (method.type === 'instant' && method.deliveryHours) {
      return (
        <span className="inline-flex items-stretch">
          {/* Icon truck - giữ nguyên aspect ratio gốc 43:22, không ép vuông */}
          <img src={SHOPEE_TRUCK_ICON_URL} alt="" className="h-[18px] w-auto" aria-hidden="true" />
          {/* Badge text - cùng chiều cao với icon, nằm sát, nối liền mạch */}
          <span className="-ml-px flex items-center rounded-r-sm bg-[#26aa99] px-1.5 text-[10px] leading-none font-medium text-white">
            {method.deliveryHours} Giờ
          </span>
        </span>
      )
    }
    return null
  }

  // PLACEHOLDER_MODAL_CONTENT
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[520px] sm:w-11/12 !p-0"
      ariaLabelledBy="shipping-modal-title"
    >
      {/* Header - Shopee style */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-700">
        <h2
          id="shipping-modal-title"
          className="text-lg font-medium text-gray-900 dark:text-gray-100"
        >
          {t('modalTitle')}
        </h2>
        <button
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none dark:hover:text-gray-300"
          aria-label={tProduct('modal.close')}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Delivery address section - Shopee style */}
      <div className="border-b border-gray-100 px-6 py-3 dark:border-slate-700">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t('deliverTo')}:{' '}
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {location || tProduct('shipping.defaultLocation')}
          </span>
        </span>
      </div>

      {/* Content - Shipping methods list */}
      <div
        className="max-h-[400px] overflow-y-auto px-6 py-4"
        aria-busy={isLoading}
        aria-live="polite"
      >
        {isLoading && (
          <div className="animate-pulse motion-reduce:animate-none space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 py-3">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-3.5 w-40 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-3 w-64 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tProduct('shipping.loadError')}
            </p>
            <button
              onClick={() => refetch()}
              className="min-h-11 rounded-sm bg-orange px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange/90 focus-visible:outline-none"
            >
              {tProduct('shipping.retry')}
            </button>
          </div>
        )}

        {!isLoading && !isError && methods.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tProduct('shipping.noMethods')}
            </p>
          </div>
        )}

        {/* Shipping methods - Shopee flat layout */}
        {hasMethods && (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700" role="list">
            {methods.map((method) => {
              const deliveryRange = getShopeeDeliveryRange(method.estimatedDays)
              const isInstant = method.type === 'instant'
              const isPickup = method.type === 'pickup'

              return (
                <li key={method._id} className="py-4 first:pt-0 last:pb-0" role="listitem">
                  {/* Method header row */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Method name */}
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {method.name}
                        </span>
                      </div>

                      {/* Delivery time */}
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {isPickup ? (
                          <span>{t('pickupPoint')}</span>
                        ) : isInstant ? (
                          <span className="flex items-center gap-2">
                            {t('receiveIn')}
                            {renderDeliveryBadge(method)}
                          </span>
                        ) : (
                          <span style={{ color: SHOPEE_TEAL }}>
                            {t('receiveFrom', { date: deliveryRange })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price section */}
                    <div className="shrink-0 text-right">
                      <span className="text-xs text-gray-400 line-through dark:text-gray-500">
                        {formatCurrency(method.price)}₫
                      </span>
                      <span className="ml-2 text-sm font-medium" style={{ color: SHOPEE_TEAL }}>
                        {t('free')}
                      </span>
                    </div>
                  </div>

                  {/* Method details - additional info */}
                  {method.details && method.details.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {method.details.map((detail, idx) => (
                        <li key={idx} className="text-xs text-gray-400 dark:text-gray-500">
                          {detail.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Footer - Đã hiểu button */}
      <div className="border-t border-gray-100 px-6 py-4 dark:border-slate-700">
        <button
          onClick={onClose}
          className="min-h-11 w-full rounded-sm bg-orange py-3 text-sm font-medium text-white transition-colors hover:bg-orange/90 focus-visible:outline-none"
        >
          {t('done')}
        </button>
      </div>
    </BaseModal>
  )
}

export default ShippingMethodModal
