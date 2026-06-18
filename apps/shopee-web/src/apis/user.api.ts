import { User } from 'src/types/user.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// Khai báo kiểu dữ liệu kế thừa từ thằng User thêm vào 2 trường password và new_password
export interface BodyUpdateProfile extends Omit<
  User,
  '_id' | 'roles' | 'createdAt' | 'updatedAt' | 'email'
> {
  // Bỏ các các keys ko sử dụng ở trên, thêm 2 trường là password, newPassword
  password?: string
  new_password?: string
  // Không có đưa lên confirm_password -> chỉ handle ở dưới client thôi
}

export interface BodySetPassword {
  new_password: string
  confirm_password: string
}

/** Fresh token pair returned after a password change / set-password — may be absent
 *  on non-password updates, so all fields are optional in the API shape. */
export interface TokenPair {
  access_token?: string
  refresh_token?: string
  expires?: number
  expires_refresh_token?: number
  accessJti?: string
  refreshJti?: string
}

/** Shape returned by PUT /me — profile data plus optional fresh token pair */
export interface UpdateProfileResponse extends TokenPair {
  user: User
}

export const userApi = {
  getProfile: () => {
    return http.get<SuccessResponseApi<User>>('/me')
  },
  updateProfile: (body: BodyUpdateProfile) => {
    return http.put<SuccessResponseApi<UpdateProfileResponse>>('/me', body)
  },
  uploadAvatar: (body: FormData) => {
    return http.post<SuccessResponseApi<string>>('/me/upload-avatar', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  setPassword: (body: BodySetPassword) => {
    return http.post<SuccessResponseApi<TokenPair>>('/set-password', body)
  },
}

export default userApi
