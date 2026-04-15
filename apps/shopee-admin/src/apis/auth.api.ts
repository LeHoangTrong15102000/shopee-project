import http from 'src/utils/http'
import type { SuccessResponse, User } from 'src/types'

interface LoginBody {
  email: string
  password: string
}

interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

const authApi = {
  login: (body: LoginBody) => http.post<SuccessResponse<LoginResponse>>('login', body),
  logout: () => http.post('logout'),
}

export default authApi
