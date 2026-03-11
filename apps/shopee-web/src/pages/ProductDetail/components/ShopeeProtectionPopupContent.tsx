import { useTranslation } from 'react-i18next';
import { ShieldIcon, ShieldCheckIcon, DeliveryTruckIcon } from 'src/components/Icons';

const ShopeeProtectionPopupContent = () => {
  const { t } = useTranslation('product');

  return (
    <div
      tabIndex={-1}
      className="w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      {/* Header */}
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('protection.modalTitle')}
      </h3>

      {/* Return Policy */}
      <div className="flex gap-2.5">
        <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange dark:text-orange-400" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('protection.returnPolicy.title')}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {t('protection.returnPolicy.description')}
          </p>
        </div>
      </div>

      <div className="my-2.5 border-t border-gray-100 dark:border-slate-700" />

      {/* Authenticity */}
      <div className="flex gap-2.5">
        <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('protection.authenticity.title')}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {t('protection.authenticity.description')}
          </p>
        </div>
      </div>

      <div className="my-2.5 border-t border-gray-100 dark:border-slate-700" />

      {/* Free Shipping */}
      <div className="flex gap-2.5">
        <DeliveryTruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('protection.freeShippingPolicy.title')}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {t('protection.freeShippingPolicy.description')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopeeProtectionPopupContent;
