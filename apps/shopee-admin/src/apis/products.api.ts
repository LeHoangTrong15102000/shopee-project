import http from 'src/utils/http'
import type { SuccessResponse, Product, PaginatedData } from 'src/types'

interface ProductListParams {
  page?: number
  limit?: number
  sort_by?: string
  order?: string
  category?: string
  name?: string
}

interface ProductBody {
  name: string
  description?: string
  price: number
  price_before_discount?: number
  quantity: number
  category: string
  image: string
  images?: string[]
  location?: string
}

const productsApi = {
  getProducts: (params?: ProductListParams) =>
    http.get<
      SuccessResponse<{ products: Product[]; pagination: PaginatedData<Product>['pagination'] }>
    >('admin/products', { params }),

  getAllProducts: (params?: { category?: string }) =>
    http.get<SuccessResponse<Product[]>>('admin/products/all', { params }),

  getProduct: (productId: string) =>
    http.get<SuccessResponse<Product>>(`admin/products/${productId}`),

  createProduct: (body: ProductBody) => http.post<SuccessResponse<Product>>('admin/products', body),

  updateProduct: (productId: string, body: Partial<ProductBody>) =>
    http.put<SuccessResponse<Product>>(`admin/products/${productId}`, body),

  deleteProduct: (productId: string) =>
    http.delete<SuccessResponse<null>>(`admin/products/delete/${productId}`),

  deleteManyProducts: (ids: string[]) =>
    http.delete<SuccessResponse<{ deletedCount: number }>>('admin/products/delete-many', {
      data: { list_id: ids },
    }),

  uploadImage: (formData: FormData) =>
    http.post<SuccessResponse<string>>('admin/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadImages: (formData: FormData) =>
    http.post<SuccessResponse<string[]>>('admin/products/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export default productsApi
