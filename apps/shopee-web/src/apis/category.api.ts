import { Category } from 'src/types/category.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const URL = '/categories'

// Interface cho API options với AbortSignal
export interface ApiOptions {
  signal?: AbortSignal
}

// Mock data for fallback when API is not available
const mockCategories: Category[] = [
  { _id: 'cat-1', name: 'Thời trang nam' },
  { _id: 'cat-2', name: 'Điện thoại & Phụ kiện' },
  { _id: 'cat-3', name: 'Thiết bị điện tử' },
  { _id: 'cat-4', name: 'Máy tính & Laptop' },
  { _id: 'cat-5', name: 'Máy ảnh & Máy quay phim' },
  { _id: 'cat-6', name: 'Đồng hồ' },
  { _id: 'cat-7', name: 'Giày dép nam' },
  { _id: 'cat-8', name: 'Thiết bị gia dụng' },
  { _id: 'cat-9', name: 'Thể thao & Du lịch' },
  { _id: 'cat-10', name: 'Ô tô & Xe máy & Xe đạp' }
]

const categoryApi = {
  getCategories: async (options?: ApiOptions) => {
    try {
      return await http.get<SuccessResponseApi<Category[]>>(URL, {
        signal: options?.signal
      })
    } catch (error) {
      console.warn('⚠️ [getCategories] API not available, using mock data')
      return {
        status: 200,
        data: {
          message: 'Lấy danh sách danh mục thành công (mock)',
          data: mockCategories
        }
      }
    }
  }
}

export default categoryApi
