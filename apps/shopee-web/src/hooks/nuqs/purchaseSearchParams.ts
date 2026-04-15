import { parseAsInteger, useQueryState } from 'nuqs'

export const purchaseStatusParser = parseAsInteger.withDefault(0)

export function usePurchaseStatus() {
  return useQueryState('status', purchaseStatusParser)
}
