import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import importApi from 'src/apis/import.api';
import { useActivityLogStore } from 'src/stores/activity-log.store';
import { useAuthStore } from 'src/stores/auth.store';

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
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: () => importApi.importProducts(),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(`Imported ${d.imported} products (deleted ${d.deleted} old)`);
      addLog({ action: 'create', entityType: 'import', entityName: `${d.imported} products imported`, adminEmail: email });
      qc.invalidateQueries({ queryKey: IMPORT_KEYS.stats });
      onSuccess?.();
    },
    onError: () => toast.error('Import failed'),
  });
}
