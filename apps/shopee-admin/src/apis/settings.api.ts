import http from 'src/utils/http'
import type { SuccessResponse, User } from 'src/types'

interface UpdateProfileBody {
  name?: string
  phone?: string
  address?: string
  avatar?: string
  date_of_birth?: string
  password?: string
  new_password?: string
}

const settingsApi = {
  getProfile: () => http.get<SuccessResponse<User>>('me'),
  updateProfile: (body: UpdateProfileBody) => http.put<SuccessResponse<User>>('me', body),
}

export default settingsApi
