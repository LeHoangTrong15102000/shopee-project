import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'
import {
  WishlistResponse,
  WishlistCheckResponse,
  WishlistCountResponse,
  WishlistClearResponse,
  AddToWishlistBody,
  WishlistItem,
} from 'src/types/wishlist.type'

export interface ApiOptions {
  signal?: AbortSignal
}

const wishlistApi = {
  getWishlist: (params?: { page?: number; limit?: number }, options?: ApiOptions) => {
    return http.get<SuccessResponseApi<WishlistResponse>>('/wishlist', {
      params,
      signal: options?.signal,
    })
  },

  addToWishlist: (body: AddToWishlistBody, options?: ApiOptions) => {
    return http.post<SuccessResponseApi<WishlistItem>>('/wishlist', body, {
      signal: options?.signal,
    })
  },

  removeFromWishlist: (productId: string, options?: ApiOptions) => {
    return http.delete<SuccessResponseApi<{ message: string }>>(`/wishlist/${productId}`, {
      signal: options?.signal,
    })
  },

  checkInWishlist: (productId: string, options?: ApiOptions) => {
    return http.get<SuccessResponseApi<WishlistCheckResponse>>(`/wishlist/check/${productId}`, {
      signal: options?.signal,
    })
  },

  clearWishlist: (options?: ApiOptions) => {
    return http.delete<SuccessResponseApi<WishlistClearResponse>>('/wishlist', {
      signal: options?.signal,
    })
  },

  getWishlistCount: (options?: ApiOptions) => {
    return http.get<SuccessResponseApi<WishlistCountResponse>>('/wishlist/count', {
      signal: options?.signal,
    })
  },
}

export default wishlistApi
