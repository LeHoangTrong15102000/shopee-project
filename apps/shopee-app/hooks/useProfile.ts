import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile, uploadAvatar, type UpdateProfileBody } from '@/apis/user.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const profileKeys = {
  all: () => ['profile'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.all(),
    queryFn: getProfile,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateProfileBody) => updateProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all() })
    },
    onError: handleMutationError,
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => uploadAvatar(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all() })
    },
    onError: handleMutationError,
  })
}
