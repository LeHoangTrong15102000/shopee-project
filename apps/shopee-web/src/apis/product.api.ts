// khai báo APi cho Product

import { Product, ProductList, ProductListConfig } from 'src/types/product.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

export interface SearchSuggestionsResponse {
  suggestions: string[]
  products: {
    _id: string
    name: string
    image: string
    price: number
  }[]
}

// Interface cho API options với AbortSignal
export interface ApiOptions {
  signal?: AbortSignal
}

export interface PriceHistoryEntry {
  price: number
  date: string
}

const productApi = {
  getProducts: (params: ProductListConfig, options?: ApiOptions) => {
    return http.get<SuccessResponseApi<ProductList>>('/products', {
      params,
      signal: options?.signal,
    })
  },

  getProductDetail: (id: string, options?: ApiOptions) => {
    return http.get<SuccessResponseApi<Product>>(`/products/${id}`, {
      signal: options?.signal,
    })
  },

  getSearchSuggestions: (params: { q: string }, options?: ApiOptions) => {
    return http.get<SuccessResponseApi<SearchSuggestionsResponse>>('products/search/suggestions', {
      params,
      signal: options?.signal,
    })
  },

  getSearchHistory: (options?: ApiOptions) => {
    return http.get<SuccessResponseApi<string[]>>('products/search/history', {
      signal: options?.signal,
    })
  },

  saveSearchHistory: (body: { keyword: string }, options?: ApiOptions) => {
    return http.post<SuccessResponseApi<{ keyword: string; saved: boolean }>>(
      'products/search/save-history',
      body,
      {
        signal: options?.signal,
      },
    )
  },

  deleteSearchHistory: (options?: ApiOptions) => {
    return http.delete<SuccessResponseApi<{ deleted_count: number }>>('products/search/history', {
      signal: options?.signal,
    })
  },

  deleteSearchHistoryItem: (keyword: string, options?: ApiOptions) => {
    return http.delete<SuccessResponseApi<{ message: string }>>(
      `products/search/history/${encodeURIComponent(keyword)}`,
      {
        signal: options?.signal,
      },
    )
  },

  getPriceHistory: (productId: string) => {
    return http.get<SuccessResponseApi<PriceHistoryEntry[]>>(`/products/${productId}/price-history`)
  },
}

export default productApi
