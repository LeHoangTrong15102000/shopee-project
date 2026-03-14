import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ordersApi from 'src/apis/orders.api';
import type { OrderStatus } from 'src/types';

export const ORDER_KEYS = {
  list: (page: number, status: string) => ['admin-orders', page, status] as const,
  all: ['admin-orders'] as const,
};

export function useOrders(page: number, status: OrderStatus | 'all') {
  return useQuery({
    queryKey: ORDER_KEYS.list(page, status),
    queryFn: () =>
      ordersApi
        .getOrders({ page: page + 1, limit: 10, ...(status !== 'all' && { status }) })
        .then((r) => r.data.data),
  });
}

export function useBulkUpdateOrderStatus(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { order_ids: string[]; status: OrderStatus }) =>
      ordersApi.bulkUpdateStatus(body),
    onSuccess: () => {
      toast.success('Orders updated');
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update orders'),
  });
}
