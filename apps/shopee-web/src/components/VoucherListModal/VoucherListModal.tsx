import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import BaseModal from 'src/components/BaseModal/BaseModal';
import VoucherCard from 'src/components/VoucherCard/VoucherCard';
import voucherApi from 'src/apis/voucher.api';

interface VoucherListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoucherListModal = ({ isOpen, onClose }: VoucherListModalProps) => {
  const { t } = useTranslation('product');
  const queryClient = useQueryClient();
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const {
    data: vouchersData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['available-vouchers'],
    queryFn: async () => {
      const res = await voucherApi.getAvailableVouchers();
      return res.data.data;
    },
    enabled: isOpen,
  });

  const vouchers = vouchersData?.vouchers || [];

  // Initialize savedIds from API response (for real backend with is_collected)
  useEffect(() => {
    if (vouchersData?.vouchers) {
      const alreadySaved = vouchersData.vouchers.filter((v) => v.is_collected).map((v) => v._id);
      setSavedIds(new Set(alreadySaved));
    }
  }, [vouchersData]);

  const handleSave = useCallback(
    async (voucherId: string) => {
      setSavingIds((prev) => new Set(prev).add(voucherId));
      // Optimistic update
      setSavedIds((prev) => new Set(prev).add(voucherId));

      try {
        await voucherApi.saveVoucher(voucherId);
        toast.success(t('voucher.saveSuccess'), { autoClose: 2000, position: 'top-center' });
        queryClient.invalidateQueries({ queryKey: ['available-vouchers'] });
        queryClient.invalidateQueries({ queryKey: ['my-vouchers'] });
      } catch {
        // Rollback optimistic update
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(voucherId);
          return next;
        });
        toast.error(t('voucher.saveError'), {
          autoClose: 3000,
          position: 'top-center',
        });
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(voucherId);
          return next;
        });
      }
    },
    [queryClient, t],
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl"
      ariaLabelledBy="voucher-modal-title"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="voucher-modal-title"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          {t('voucher.modalTitle')}
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse motion-reduce:animate-none rounded-lg bg-gray-200 dark:bg-slate-700"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('voucher.loadError')}</p>
            <button
              onClick={() => refetch()}
              className="rounded-md bg-orange px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
            >
              {t('voucher.retry')}
            </button>
          </div>
        )}

        {!isLoading && !isError && vouchers.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('voucher.noVouchers')}</p>
          </div>
        )}

        {!isLoading && !isError && vouchers.length > 0 && (
          <div
            className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3"
            tabIndex={0}
            role="region"
            aria-label={t('voucher.modalTitle')}
          >
            {vouchers.map((voucher) => (
              <VoucherCard
                key={voucher._id}
                voucher={voucher}
                isSaved={savedIds.has(voucher._id)}
                onSave={handleSave}
                isLoading={savingIds.has(voucher._id)}
              />
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default VoucherListModal;
