import http from 'src/utils/http'
import type { SuccessResponse, User, PaginatedData } from 'src/types'

interface UserListParams {
  page?: number
  limit?: number
  search?: string
}

interface CreateUserBody {
  email: string
  password: string
  name?: string
  roles?: string[]
}

interface UpdateUserBody {
  name?: string
  email?: string
  roles?: string[]
}

const usersApi = {
  getUsers: (params?: UserListParams) =>
    http.get<SuccessResponse<PaginatedData<User>>>('admin/users', { params }),

  getUser: (userId: string) => http.get<SuccessResponse<User>>(`admin/users/${userId}`),

  createUser: (body: CreateUserBody) => http.post<SuccessResponse<User>>('admin/users', body),

  updateUser: (userId: string, body: UpdateUserBody) =>
    http.put<SuccessResponse<User>>(`admin/users/${userId}`, body),

  deleteUser: (userId: string) =>
    http.delete<SuccessResponse<null>>(`admin/users/delete/${userId}`),
}

export default usersApi
