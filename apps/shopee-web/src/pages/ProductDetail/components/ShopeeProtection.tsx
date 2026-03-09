import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ShopeeProtectionModal from 'src/components/ShopeeProtectionModal';

const ShopeeProtection = () => {
  const { t } = useTranslation('product');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className="flex cursor-pointer items-center gap-3 border-t border-gray-100 py-4 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange dark:border-slate-700 dark:hover:bg-slate-700/50"
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={t('protection.shopeeGuarantee')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        <span className="w-28 shrink-0 text-sm text-gray-500 dark:text-gray-400">
          {t('protection.shopeeGuarantee')}
        </span>
        <div className="flex flex-1 items-center gap-2">
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
        {/* Chevron icon */}
        <svg
          className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <ShopeeProtectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default ShopeeProtection;
