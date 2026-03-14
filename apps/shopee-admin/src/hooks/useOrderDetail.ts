import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ordersApi from 'src/apis/orders.api';
import type { OrderStatus } from 'src/types';

export const ORDER_DETAIL_KEYS = {
  detail: (id: string) => ['admin-order', id] as const,
};

export function useOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: ORDER_DETAIL_KEYS.detail(id!),
    queryFn: () => ordersApi.getOrder(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus(id: string | undefined, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateOrderStatus(id!, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ORDER_DETAIL_KEYS.detail(id!) });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update status'),
  });
}
