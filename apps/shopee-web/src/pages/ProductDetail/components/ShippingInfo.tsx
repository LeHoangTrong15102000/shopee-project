import { useTranslation } from 'react-i18next';
import { getEstimatedDeliveryDate } from 'src/utils/date';

interface ShippingInfoProps {
  location: string;
}

const DEFAULT_DELIVERY_DAYS = '3-5 ngày';

const ShippingInfo = ({ location }: ShippingInfoProps) => {
  const { t } = useTranslation('product');

  // Estimated delivery: 3-5 days from now using existing utility
  const deliveryRange = getEstimatedDeliveryDate(DEFAULT_DELIVERY_DAYS);

  return (
    <div className="flex items-start gap-3 border-t border-gray-100 py-4 dark:border-slate-700">
      <span className="w-28 shrink-0 text-sm text-gray-500 dark:text-gray-400">
        {t('shipping.label')}
      </span>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            className="h-5 w-5 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
            />
          </svg>
          <span className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-500">
            {t('shipping.freeShipping')}
          </span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('shipping.estimatedDelivery', { date: deliveryRange })}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('shipping.deliverFrom', { location: location || t('shipping.defaultLocation') })}
        </div>
      </div>
    </div>
  );
};

export default ShippingInfo;
