import http from 'src/utils/http'
import type { SuccessResponse, Category } from 'src/types'

interface CategoryListParams {
  page?: number
  limit?: number
}

const categoriesApi = {
  getCategories: (params?: CategoryListParams) =>
    http.get<SuccessResponse<Category[]>>('admin/categories', { params }),

  getCategory: (categoryId: string) =>
    http.get<SuccessResponse<Category>>(`admin/categories/${categoryId}`),

  createCategory: (body: { name: string }) =>
    http.post<SuccessResponse<Category>>('admin/categories', body),

  updateCategory: (categoryId: string, body: { name: string }) =>
    http.put<SuccessResponse<Category>>(`admin/categories/${categoryId}`, body),

  deleteCategory: (categoryId: string) =>
    http.delete<SuccessResponse<null>>(`admin/categories/delete/${categoryId}`),
}

export default categoriesApi
