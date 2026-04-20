import http from '@/utils/http'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  message: string
  data: T
}

export interface Address {
  _id: string
  name: string
  phone: string
  street: string
  ward?: string
  district?: string
  city: string
  is_default: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAddressBody {
  name: string
  phone: string
  street: string
  ward?: string
  district?: string
  city: string
  is_default?: boolean
}

// ─── Address API ──────────────────────────────────────────────────────────────

export async function getAddresses() {
  const res = await http.get<ApiResponse<Address[]>>('addresses')
  return res.data
}

export async function createAddress(body: CreateAddressBody) {
  const res = await http.post<ApiResponse<Address>>('addresses', body)
  return res.data
}

export async function updateAddress(id: string, body: Partial<CreateAddressBody>) {
  const res = await http.put<ApiResponse<Address>>(`addresses/${id}`, body)
  return res.data
}

export async function deleteAddress(id: string) {
  const res = await http.delete<ApiResponse<unknown>>(`addresses/${id}`)
  return res.data
}

export async function setDefaultAddress(id: string) {
  const res = await http.put<ApiResponse<Address>>(`addresses/${id}/default`)
  return res.data
}
