import { useQuery, useMutation } from '@tanstack/react-query'
import { Share } from 'react-native' // React Native's built-in Share (native OS share sheet, bundled by Expo); expo-sharing is not a dependency
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { getSimilarProducts, getBoughtTogether, shareProduct } from '@/apis/product.api'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/authStore'

// 5-minute stale time — recommendations change slowly
const RECO_STALE_TIME = 5 * 60 * 1000

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export function useSimilarProducts(productId: string) {
  return useQuery({
    queryKey: ['product', productId, 'similar'],
    queryFn: () => getSimilarProducts(productId),
    enabled: !!productId,
    staleTime: RECO_STALE_TIME,
  })
}

export function useBoughtTogether(productId: string) {
  return useQuery({
    queryKey: ['product', productId, 'bought-together'],
    queryFn: () => getBoughtTogether(productId),
    enabled: !!productId,
    staleTime: RECO_STALE_TIME,
  })
}

// ─── Share Mutation ──────────────────────────────────────────────────────────

export function useShareProduct(productId: string) {
  const { t } = useTranslation()
  const { showSuccess, showInfo, showError } = useToast()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const router = useRouter()

  return useMutation({
    mutationFn: () => {
      if (!isAuthenticated) {
        // Fix 2: show sign-in prompt toast before redirecting (tasks.md 3.3 + 5.1)
        showInfo(t('PD_SHARE_SIGN_IN_PROMPT'))
        router.push('/(auth)/sign-in')
        // Return a rejected promise so onSuccess is not triggered
        return Promise.reject(new Error('unauthenticated'))
      }
      return shareProduct(productId)
    },
    onSuccess: async (data) => {
      // Fix 1: include message field so Android share receives the URL (url-only is ignored on Android)
      const result = await Share.share({ message: data.shareUrl, url: data.shareUrl })
      // Share.sharedAction means the user shared; dismissedAction is a normal cancel — not an error
      if (result.action === Share.sharedAction) {
        showSuccess(t('PD_SHARE_SUCCESS'))
      }
      // dismissedAction: sheet was dismissed — no toast, no error (design.md decision 3)
    },
    onError: (error: unknown) => {
      // Ignore the unauthenticated redirect pseudo-error; redirect already done
      if (error instanceof Error && error.message === 'unauthenticated') return
      // Fix 3: surface share-specific error key (tasks.md 5.1); fall back to generic handler for
      // auth/network errors that don't have a dedicated message
      showError(t('PD_SHARE_ERROR'))
    },
  })
}
