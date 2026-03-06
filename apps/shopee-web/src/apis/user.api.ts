import { User } from 'src/types/user.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// Khai báo kiểu dữ liệu kế thừa từ thằng User thêm vào 2 trường password và new_password
export interface BodyUpdateProfile extends Omit<User, '_id' | 'roles' | 'createdAt' | 'updatedAt' | 'email'> {
  // Bỏ các các keys ko sử dụng ở trên, thêm 2 trường là password, newPassword
  password?: string
  new_password?: string
  // Không có đưa lên confirm_password -> chỉ handle ở dưới client thôi
}

// Mock data for fallback when API is not available
const mockUser: User = {
  _id: 'mock-user-id',
  roles: ['User'] as ('User' | 'Admin')[],
  email: 'user@shopee.vn',
  name: 'Nguyễn Văn A',
  date_of_birth: '1990-01-15T00:00:00.000Z',
  avatar: 'https://picsum.photos/seed/avatar/200',
  address: 'Quận 1, Hồ Chí Minh',
  phone: '0901234567',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
}

export const userApi = {
  getProfile: async () => {
    try {
      return await http.get<SuccessResponseApi<User>>('/me')
    } catch (error) {
      console.warn('⚠️ [getProfile] API not available, using mock data')
      return {
        status: 200,
        data: {
          message: 'Lấy thông tin người dùng thành công (mock)',
          data: mockUser
        }
      }
    }
  },
  updateProfile: async (body: BodyUpdateProfile) => {
    try {
      return await http.put<SuccessResponseApi<User>>('/user', body)
    } catch (error) {
      console.warn('⚠️ [updateProfile] API not available, using mock data')
      return {
        status: 200,
        data: {
          message: 'Cập nhật thông tin người dùng thành công (mock)',
          data: {
            ...mockUser,
            ...body,
            updatedAt: new Date().toISOString()
          }
        }
      }
    }
  },
  uploadAvatar: async (body: FormData) => {
    try {
      return await http.post<SuccessResponseApi<string>>('/user/upload-avatar', body, {
        // Và phải truyền lên cái headers định dạng như này để có thể uploadAvatar
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } catch (error) {
      console.warn('⚠️ [uploadAvatar] API not available, using mock data')
      return {
        status: 200,
        data: {
          message: 'Upload ảnh đại diện thành công (mock)',
          data: 'https://picsum.photos/seed/avatar-new/200'
        }
      }
    }
  }
}

export default userApi
