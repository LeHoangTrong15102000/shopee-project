import { useQuery } from '@tanstack/react-query'
import { getHomepage, getCmsPage } from '@/apis/cmsPages.api'
import type { CmsPage } from '@/apis/cmsPages.api'
import { AxiosError } from 'axios'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const cmsPagesKeys = {
  homepage: () => ['cms-pages', 'homepage'] as const,
  page: (slug: string) => ['cms-pages', slug] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches the published homepage CMS page.
 * Returns undefined data when the page is not published (404).
 * staleTime: 5 min.
 */
export function useHomepageContent() {
  return useQuery<CmsPage | null>({
    queryKey: cmsPagesKeys.homepage(),
    queryFn: async () => {
      try {
        return await getHomepage()
      } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 404) {
          return null
        }
        throw err
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetches a CMS page by slug.
 * Throws on non-404 errors so callers can show error state.
 * staleTime: 5 min.
 */
export function useCmsPage(slug: string) {
  return useQuery<CmsPage>({
    queryKey: cmsPagesKeys.page(slug),
    queryFn: () => getCmsPage(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}
