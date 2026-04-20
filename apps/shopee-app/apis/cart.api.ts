import http from '@/utils/http'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  message: string
  data: T
}

export interface CartProduct {
  _id: string
  name: string
  image: string
  price: number
  price_before_discount: number
  quantity: number
}

export interface CartItem {
  _id: string
  product: CartProduct
  buy_count: number
  price: number
  price_before_discount: number
  status: number
  createdAt: string
  updatedAt: string
}

// ─── Cart API ─────────────────────────────────────────────────────────────────

export async function getCart() {
  const res = await http.get<ApiResponse<CartItem[]>>('purchases', {
    params: { status: -1 },
  })
  return res.data
}

export async function updateCartItem(body: { product_id: string; buy_count: number }) {
  const res = await http.put<ApiResponse<CartItem>>('purchases', body)
  return res.data
}

export async function deleteCartItems(purchaseIds: string[]) {
  const res = await http.delete<ApiResponse<{ deleted_count: number }>>('purchases', {
    data: purchaseIds,
  })
  return res.data
}
