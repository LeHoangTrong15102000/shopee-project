import { Shop, ShopProductsParams } from 'src/types/shop.type'
import { ProductList } from 'src/types/product.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const shopApi = {
  getShop: (id: string) => {
    return http.get<SuccessResponseApi<Shop>>(`/shops/${id}`)
  },

  getShopProducts: (id: string, params?: ShopProductsParams) => {
    return http.get<SuccessResponseApi<ProductList>>(`/shops/${id}/products`, { params })
  },

  followShop: (id: string) => {
    return http.post<SuccessResponseApi<{ message: string }>>(`/shops/${id}/follow`)
  },

  unfollowShop: (id: string) => {
    return http.delete<SuccessResponseApi<{ message: string }>>(`/shops/${id}/follow`)
  },
}

export default shopApi
