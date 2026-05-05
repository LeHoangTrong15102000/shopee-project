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

export const userApi = {
  getProfile: () => {
    return http.get<SuccessResponseApi<User>>('/me')
  },
  updateProfile: (body: BodyUpdateProfile) => {
    return http.put<SuccessResponseApi<User>>('/user', body)
  },
  uploadAvatar: (body: FormData) => {
    return http.post<SuccessResponseApi<string>>('/user/upload-avatar', body, {
      // Và phải truyền lên cái headers định dạng như này để có thể uploadAvatar
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

export default userApi
