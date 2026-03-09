import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import BaseModal from 'src/components/BaseModal/BaseModal';
import ShippingMethodSelector from 'src/components/ShippingMethodSelector/ShippingMethodSelector';
import checkoutApi from 'src/apis/checkout.api';

interface ShippingMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const noop = () => {};

const ShippingMethodModal = ({ isOpen, onClose }: ShippingMethodModalProps) => {
  const { t } = useTranslation('product');

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
  const showSelector = !isLoading && !isError && methods.length > 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-2xl sm:w-11/12"
      ariaLabelledBy="shipping-modal-title"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="shipping-modal-title"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          {t('shipping.modalTitle')}
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
      <div aria-busy={isLoading} aria-live="polite">
        {isLoading && (
          <div className="animate-pulse motion-reduce:animate-none space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-gray-200 dark:bg-slate-700" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('shipping.loadError')}</p>
            <button
              onClick={() => refetch()}
              className="rounded-md bg-orange px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
            >
              {t('shipping.retry')}
            </button>
          </div>
        )}

        {!isLoading && !isError && methods.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('shipping.noMethods')}</p>
          </div>
        )}

        {/* View-only mode: viewOnly prop makes items readable but non-interactive */}
        {showSelector && (
          <div className="max-h-[60vh] overflow-y-auto">
            <ShippingMethodSelector selectedMethodId={null} onSelect={noop} viewOnly />
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ShippingMethodModal;
