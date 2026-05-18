import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import importApi from 'src/apis/import.api'
import { useAdminMutationContext } from './useAdminMutationContext'

export const IMPORT_KEYS = {
  stats: ['admin-import-stats'] as const,
}

export function useImportStats() {
  return useQuery({
    queryKey: IMPORT_KEYS.stats,
    queryFn: () => importApi.getImportStats().then((r) => r.data.data),
  })
}

export function useImportProducts(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (file: File) => importApi.importProducts(file),
    onSuccess: (res) => {
      const d = res.data.data
      toast.success(
        i18n.t('toast.imported', {
          ns: 'import',
          created: d.created,
          updated: d.updated,
          failed: d.failed,
        }),
      )
      qc.invalidateQueries({ queryKey: IMPORT_KEYS.stats })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.importFailed', { ns: 'import' }))
    },
  })
}
