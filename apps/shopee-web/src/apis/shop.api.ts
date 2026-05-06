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
}

export default shopApi
