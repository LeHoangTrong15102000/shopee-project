import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import importApi from 'src/apis/import.api';

export const IMPORT_KEYS = {
  stats: ['admin-import-stats'] as const,
};

export function useImportStats() {
  return useQuery({
    queryKey: IMPORT_KEYS.stats,
    queryFn: () => importApi.getImportStats().then((r) => r.data.data),
  });
}

export function useImportProducts(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => importApi.importProducts(),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(`Imported ${d.imported} products (deleted ${d.deleted} old)`);
      qc.invalidateQueries({ queryKey: IMPORT_KEYS.stats });
      onSuccess?.();
    },
    onError: () => toast.error('Import failed'),
  });
}
