import { useQueryClient } from '@tanstack/react-query'

export function useAdminMutationContext() {
  const qc = useQueryClient()
  return { qc }
}
