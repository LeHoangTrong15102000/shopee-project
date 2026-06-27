import { Purchase, PurchaseListStatus } from 'src/types/purchases.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// Khai báo các api của purchases

const purchaseApi = {
  // addToCart gửi lên từng sản phẩm - purchase
  addToCart: (body: { product_id: string; buy_count: number; sku_id?: string }) => {
    return http.post<SuccessResponseApi<Purchase>>('/purchases/add-to-cart', body)
  },
  // lấy ra danh sách các status của purchase, getPurchaseList thì trả về array các purchases
  getPurchases: (params: { status: PurchaseListStatus }) => {
    return http.get<SuccessResponseApi<Purchase[]>>('/purchases', { params })
  },
  // buy-product, body là mảng các object
  buyPurchases: (body: { product_id: string; buy_count: number; sku_id?: string }[]) => {
    return http.post<SuccessResponseApi<Purchase[]>>('/purchases/buy-products', body)
  },
  updatePurchase: (body: {
    product_id: string
    buy_count: number
    sku_id?: string
    target_sku_id?: string
  }) => {
    return http.put<SuccessResponseApi<Purchase>>('/purchases/update-purchase', body)
  },
  deletePurchase: (purchaseIds: string[]) => {
    return http.delete<SuccessResponseApi<{ deleted_count: number }>>('/purchases', {
      data: purchaseIds, // data nhận vào là một sản phẩm cần xóa hoặc nhiều sản phẩm
    })
  },
}

export default purchaseApi
