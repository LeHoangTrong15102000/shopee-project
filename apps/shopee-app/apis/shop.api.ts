import http from '@/utils/http'
import { Shop, ShopProductsResponse } from '@/types/shop.type'
import { type ApiResponse } from '@/types/api.type'

export async function getShop(id: string): Promise<Shop> {
  const res = await http.get<ApiResponse<Shop>>(`shops/${id}`)
  return res.data.data
}

export async function getShopProducts(
  id: string,
  page = 1,
  limit = 20,
  sort = 'createdAt',
): Promise<ShopProductsResponse> {
  const res = await http.get<ApiResponse<ShopProductsResponse>>(`shops/${id}/products`, {
    params: { page, limit, sort },
  })
  return res.data.data
}

export async function followShop(id: string): Promise<void> {
  await http.post(`shops/${id}/follow`)
}

export async function unfollowShop(id: string): Promise<void> {
  await http.delete(`shops/${id}/follow`)
}
