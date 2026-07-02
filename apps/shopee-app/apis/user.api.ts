import http from '@/utils/http'
import { User } from '@/types/user.type'
import { type ApiResponse } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UpdateProfileBody {
  name?: string
  phone?: string
  address?: string
  date_of_birth?: string
  avatar?: string
  password?: string
  new_password?: string
}

// ─── User API ─────────────────────────────────────────────────────────────────

export async function getProfile() {
  const res = await http.get<ApiResponse<User>>('me')
  return res.data
}

export async function updateProfile(body: UpdateProfileBody) {
  const res = await http.put<ApiResponse<User>>('me', body)
  return res.data
}

export async function uploadAvatar(formData: FormData) {
  const res = await http.post<ApiResponse<{ avatar: string }>>('me/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
