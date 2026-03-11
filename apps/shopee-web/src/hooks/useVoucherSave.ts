import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import voucherApi from 'src/apis/voucher.api';

interface UseVoucherSaveOptions {
  enabled?: boolean;
}

const useVoucherSave = ({ enabled = true }: UseVoucherSaveOptions = {}) => {
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
    enabled,
  });

  const vouchers = vouchersData?.vouchers || [];

  // Initialize savedIds from API response
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
        toast.error(t('voucher.saveError'), { autoClose: 3000, position: 'top-center' });
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

  return { vouchers, isLoading, isError, refetch, savedIds, savingIds, handleSave };
};

export default useVoucherSave;
