import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import BaseModal from 'src/components/BaseModal/BaseModal';
import checkoutApi from 'src/apis/checkout.api';
import { formatCurrency } from 'src/utils/utils';
import { getShopeeDeliveryRange } from 'src/utils/date';

// Shopee official truck icon URL
const SHOPEE_TRUCK_ICON_URL =
  'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/productdetailspage/6b56a09bbc0bcca75e85.svg';

// Shopee teal color for free shipping text
const SHOPEE_TEAL = '#219787';

interface ShippingMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: string;
}

const ShippingMethodModal = ({ isOpen, onClose, location }: ShippingMethodModalProps) => {
  const { t } = useTranslation('shipping');
  const { t: tProduct } = useTranslation('product');

  const {
    data: methodsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const res = await checkoutApi.getShippingMethods();
      return res.data.data;
    },
    enabled: isOpen,
  });

  const methods = methodsData || [];
  const hasMethods = !isLoading && !isError && methods.length > 0;

  // Find the fastest method (lowest estimatedDays)
  const fastestId = hasMethods
    ? methods.reduce((fastest, m) => {
        const cur = parseInt((m.estimatedDays.match(/(\d+)/) || ['0', '0'])[1], 10);
        const prev = parseInt((fastest.estimatedDays.match(/(\d+)/) || ['0', '0'])[1], 10);
        return cur < prev ? m : fastest;
      })._id
    : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[520px] sm:w-11/12 !p-0"
      ariaLabelledBy="shipping-modal-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-700">
        <h2
          id="shipping-modal-title"
          className="text-base font-medium text-gray-900 dark:text-gray-100"
        >
          {tProduct('shipping.modalTitle')}
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

      {/* Free shipping promotion — Shopee style */}
      <div className="border-b border-gray-100 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <img
            src={SHOPEE_TRUCK_ICON_URL}
            alt=""
            className="h-6 w-6"
            aria-hidden="true"
          />
          <span
            className="rounded px-2 py-0.5 text-xs font-medium"
            style={{ color: SHOPEE_TEAL, backgroundColor: 'rgba(33, 151, 135, 0.1)' }}
          >
            {t('freeShipPromo')}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('shippingCostFree')}</span>
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {t('lateDeliveryVoucher')}
        </p>
      </div>

      {/* Address section — Từ / Đến with dot connector */}
      <div className="border-b border-gray-100 px-6 py-5 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center pt-1" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-teal-500 bg-white dark:bg-slate-800" />
            <span className="my-1 h-6 w-px border-l border-dashed border-gray-300 dark:border-slate-600" />
            <span className="h-2.5 w-2.5 rounded-full border-2 border-orange bg-white dark:bg-slate-800" />
          </div>
          <div className="flex-1 space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-7 shrink-0 text-xs text-gray-400 dark:text-gray-500">
                {t('from')}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {location || tProduct('shipping.defaultLocation')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-7 shrink-0 text-xs text-gray-400 dark:text-gray-500">
                {t('to')}
              </span>
              <span className="text-gray-700 dark:text-gray-300">{t('addressPlaceholder')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5" aria-busy={isLoading} aria-live="polite">
        {isLoading && (
          <div className="animate-pulse motion-reduce:animate-none space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <div className="h-6 w-6 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-3.5 w-40 rounded bg-gray-200 dark:bg-slate-700" />
                </div>
                <div className="h-4 w-20 rounded bg-gray-200 dark:bg-slate-700" />
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

        {/* Shipping methods — Shopee flat row layout with truck icons */}
        {hasMethods && (
          <>
            <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('supportedMethods')}
            </h3>
            <ul className="divide-y divide-gray-50 dark:divide-slate-700/50" role="list">
              {methods.map((method) => {
                const deliveryRange = getShopeeDeliveryRange(method.estimatedDays);
                return (
                  <li
                    key={method._id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                    role="listitem"
                  >
                    <img
                      src={SHOPEE_TRUCK_ICON_URL}
                      alt=""
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-800 dark:text-gray-200">
                          {method.name}
                        </span>
                        {method._id === fastestId && (
                          <span className="rounded-sm bg-orange/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange uppercase dark:bg-orange-400/10 dark:text-orange-400">
                            {t('fastest')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs" style={{ color: SHOPEE_TEAL }}>
                        {t('receiveFrom', { date: deliveryRange })}
                      </p>
                    </div>
                    <div className="shrink-0 pl-3 text-right">
                      {method.price === 0 ? (
                        <span className="text-sm font-medium" style={{ color: SHOPEE_TEAL }}>
                          {tProduct('shipping.free')}
                        </span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-400 line-through dark:text-gray-500">
                            ₫{formatCurrency(method.price)}
                          </span>
                          <span className="text-sm font-medium" style={{ color: SHOPEE_TEAL }}>
                            ₫0
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Footer — Đã hiểu button */}
      <div className="border-t border-gray-100 px-6 py-4 dark:border-slate-700">
        <button
          onClick={onClose}
          className="min-h-11 w-full rounded-sm bg-orange py-3 text-sm font-medium text-white transition-colors hover:bg-orange/90 focus-visible:outline-none"
        >
          {t('done')}
        </button>
      </div>
    </BaseModal>
  );
};

export default ShippingMethodModal;
