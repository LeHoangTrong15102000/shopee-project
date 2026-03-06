import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
  inferParserType,
  createSerializer
} from 'nuqs'

export const productSearchParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(20),
  sort_by: parseAsStringLiteral(['createdAt', 'view', 'sold', 'price'] as const).withDefault('createdAt'),
  order: parseAsStringLiteral(['asc', 'desc'] as const),
  exclude: parseAsString,
  name: parseAsString,
  price_min: parseAsInteger,
  price_max: parseAsInteger,
  rating_filter: parseAsInteger,
  category: parseAsString
}

export type ProductQueryConfig = inferParserType<typeof productSearchParsers>

export function useProductQueryStates() {
  const [filters, setFilters] = useQueryStates(productSearchParsers)
  return [filters, setFilters] as const
}

export const createProductSearchURL = createSerializer(productSearchParsers)

/**
 * Normalizes ProductQueryConfig values back to strings for TanStack Query key compatibility.
 * During the migration transition, this ensures queryKey format stays consistent
 * so existing cache entries (with string values) are still matched.
 * Can be removed after cache transition period (gcTime = 10 min).
 */
export function normalizeProductQueryKey(filters: ProductQueryConfig): Record<string, string | undefined> {
  return {
    page: String(filters.page),
    limit: String(filters.limit),
    sort_by: filters.sort_by,
    order: filters.order ?? undefined,
    exclude: filters.exclude ?? undefined,
    name: filters.name ?? undefined,
    price_min: filters.price_min != null ? String(filters.price_min) : undefined,
    price_max: filters.price_max != null ? String(filters.price_max) : undefined,
    rating_filter: filters.rating_filter != null ? String(filters.rating_filter) : undefined,
    category: filters.category ?? undefined
  }
}
