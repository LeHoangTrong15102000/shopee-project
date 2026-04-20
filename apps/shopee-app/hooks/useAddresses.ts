import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type CreateAddressBody,
} from '@/apis/address.api'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const addressKeys = {
  all: () => ['addresses'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.all(),
    queryFn: getAddresses,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAddressBody) => createAddress(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all() })
    },
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateAddressBody> }) =>
      updateAddress(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all() })
    },
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all() })
    },
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all() })
    },
  })
}
