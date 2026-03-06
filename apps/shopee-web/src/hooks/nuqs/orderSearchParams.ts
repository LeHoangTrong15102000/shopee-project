import { parseAsInteger, useQueryState } from 'nuqs'

export const orderStatusParser = parseAsInteger.withDefault(0)

export function useOrderStatus() {
  return useQueryState('status', orderStatusParser)
}
