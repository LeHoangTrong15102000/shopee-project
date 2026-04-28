import { isAxiosError } from 'axios'
import i18n from '@/config/i18n'
import { toast } from './toast'

/**
 * Centralized mutation error handler for all useMutation onError callbacks.
 * Handles API errors, validation errors, network errors, 401 unauthorized, and generic fallbacks.
 *
 * @param error - The error object from the mutation (unknown type for safety)
 */
export function handleMutationError(error: unknown): void {
  const t = i18n.t.bind(i18n)

  // Type guard: Check if it's an Axios error
  if (isAxiosError(error)) {
    const response = error.response

    // Case 1: 401 Unauthorized (session expired - refresh token also failed)
    if (response?.status === 401) {
      toast.error(t('errors.sessionExpiredTitle'), t('errors.sessionExpiredMessage'))
      return
    }

    // Case 2: Network error (no response from server)
    if (!response) {
      toast.error(t('errors.networkTitle'), t('errors.networkMessage'))
      return
    }

    // Case 3: API returned an error message
    const data = response.data as { message?: string; errors?: Record<string, string> } | undefined

    if (data?.message) {
      toast.error(t('errors.genericTitle'), data.message)
      return
    }

    // Case 4: Validation errors (field-level errors object)
    if (data?.errors && typeof data.errors === 'object') {
      const fieldErrors = Object.entries(data.errors)
      if (fieldErrors.length > 0) {
        const [field, message] = fieldErrors[0]
        toast.error(t('errors.validationTitle'), `${field}: ${message}`)
        return
      }
    }
  }

  // Case 5: Generic fallback for all other errors
  toast.error(t('errors.genericTitle'), t('errors.genericMessage'))
}
