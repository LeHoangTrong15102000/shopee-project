import { Category } from 'src/types/category.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const URL = '/categories'

// Interface cho API options với AbortSignal
export interface ApiOptions {
  signal?: AbortSignal
}

const categoryApi = {
  getCategories: (options?: ApiOptions) => {
    return http.get<SuccessResponseApi<Category[]>>(URL, {
      signal: options?.signal,
    })
  },
}

export default categoryApi
