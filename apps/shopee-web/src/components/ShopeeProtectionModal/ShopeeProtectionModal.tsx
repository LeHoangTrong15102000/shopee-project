import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import BaseModal from 'src/components/BaseModal/BaseModal';

interface ShopeeProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SectionProps {
  t: TFunction<'product'>;
}

const ReturnPolicySection = ({ t }: SectionProps) => (
  <div className="flex gap-3">
    <div className="shrink-0">
      <svg
        className="h-8 w-8 text-orange dark:text-orange-400"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('protection.returnPolicy.title')}
      </h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {t('protection.returnPolicy.description')}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
        <li>• {t('protection.returnPolicy.condition1')}</li>
        <li>• {t('protection.returnPolicy.condition2')}</li>
        <li>• {t('protection.returnPolicy.process')}</li>
      </ul>
    </div>
  </div>
);

const AuthenticitySection = ({ t }: SectionProps) => (
  <div className="flex gap-3">
    <div className="shrink-0">
      <svg
        className="h-8 w-8 text-blue-500 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('protection.authenticity.title')}
      </h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {t('protection.authenticity.description')}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
        <li>• {t('protection.authenticity.verification')}</li>
        <li>• {t('protection.authenticity.compensation')}</li>
      </ul>
    </div>
  </div>
);

const FreeShippingSection = ({ t }: SectionProps) => (
  <div className="flex gap-3">
    <div className="shrink-0">
      <svg
        className="h-8 w-8 text-emerald-500 dark:text-emerald-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
        />
      </svg>
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('protection.freeShippingPolicy.title')}
      </h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {t('protection.freeShippingPolicy.description')}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
        <li>• {t('protection.freeShippingPolicy.conditions')}</li>
        <li>• {t('protection.freeShippingPolicy.coverage')}</li>
      </ul>
    </div>
  </div>
);

const ShopeeProtectionModal = ({ isOpen, onClose }: ShopeeProtectionModalProps) => {
  const { t } = useTranslation('product');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl sm:w-11/12"
      ariaLabelledBy="protection-modal-title"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="protection-modal-title"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          {t('protection.modalTitle')}
        </h2>
        <button
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 dark:hover:bg-slate-700 dark:hover:text-gray-300"
          aria-label={t('modal.close')}
        >
          <svg
            className="h-5 w-5"
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

      {/* Content */}
      <div
        className="max-h-[60vh] space-y-5 overflow-y-auto"
        tabIndex={0}
        role="region"
        aria-label={t('protection.modalTitle')}
      >
        <ReturnPolicySection t={t} />
        <div className="border-t border-gray-100 dark:border-slate-700" />
        <AuthenticitySection t={t} />
        <div className="border-t border-gray-100 dark:border-slate-700" />
        <FreeShippingSection t={t} />
      </div>
    </BaseModal>
  );
};

export default ShopeeProtectionModal;
