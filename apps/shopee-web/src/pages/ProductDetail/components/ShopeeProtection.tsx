import { useTranslation } from 'react-i18next';

const ShopeeProtection = () => {
  const { t } = useTranslation('product');

  return (
    <div className="flex items-center gap-3 border-t border-gray-100 py-4 dark:border-slate-700">
      <span className="w-28 shrink-0 text-sm text-gray-500 dark:text-gray-400">
        {t('protection.shopeeGuarantee')}
      </span>
      <div className="flex items-center gap-2">
        <svg
          aria-hidden="true"
          className="h-4 w-4 text-orange dark:text-orange-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t('protection.freeReturn')}
        </span>
      </div>
    </div>
  );
};

export default ShopeeProtection;
