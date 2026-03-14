import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import vouchersApi from 'src/apis/vouchers.api';
import type { DiscountType } from 'src/types';

export const VOUCHER_KEYS = {
  list: (page: number) => ['admin-vouchers', page] as const,
  all: ['admin-vouchers'] as const,
  stats: ['admin-voucher-stats'] as const,
};

export function useVouchers(page: number) {
  return useQuery({
    queryKey: VOUCHER_KEYS.list(page),
    queryFn: () => vouchersApi.getVouchers({ page: page + 1, limit: 10 }).then((r) => r.data.data),
  });
}

export function useVoucherStats() {
  return useQuery({
    queryKey: VOUCHER_KEYS.stats,
    queryFn: () => vouchersApi.getVoucherStats().then((r) => r.data.data),
  });
}

export function useCreateVoucher(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      code: string;
      discount_type: DiscountType;
      discount_value: number;
      min_order_value?: number;
      usage_limit?: number;
      start_date: string;
      end_date: string;
    }) => vouchersApi.createVoucher(body),
    onSuccess: () => {
      toast.success('Voucher created');
      qc.invalidateQueries({ queryKey: VOUCHER_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create voucher'),
  });
}

export function useDeleteVoucher(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vouchersApi.deleteVoucher(id),
    onSuccess: () => {
      toast.success('Voucher deleted');
      qc.invalidateQueries({ queryKey: VOUCHER_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete voucher'),
  });
}

export function useUpdateVoucher(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<{
        code: string;
        discount_type: DiscountType;
        discount_value: number;
        min_order_value?: number;
        usage_limit?: number;
        start_date: string;
        end_date: string;
      }> & { is_active?: boolean };
    }) => vouchersApi.updateVoucher(id, body),
    onSuccess: () => {
      toast.success('Voucher updated');
      qc.invalidateQueries({ queryKey: VOUCHER_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update voucher'),
  });
}

export function useToggleVoucher(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      vouchersApi.updateVoucher(id, { is_active }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: VOUCHER_KEYS.all });
      qc.invalidateQueries({ queryKey: VOUCHER_KEYS.stats });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update status'),
  });
}
