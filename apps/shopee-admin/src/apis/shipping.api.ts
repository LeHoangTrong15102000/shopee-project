import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'
import type { ShippingMethod, CreateShippingMethodBody, UpdateShippingMethodBody, ReorderShippingItem } from 'src/types/shipping.types'

const shippingApi = {
  // ─── User-facing ────────────────────────────────────────────────
  getShippingMethods: () =>
    http.get<SuccessResponse<ShippingMethod[]>>('orders/shipping/methods'),

  // ─── Admin CRUD ──────────────────────────────────────────────────
  getAdminShippingMethods: () =>
    http.get<SuccessResponse<ShippingMethod[]>>('admin/shipping-methods'),

  getAdminShippingMethodById: (id: string) =>
    http.get<SuccessResponse<ShippingMethod>>(`admin/shipping-methods/${id}`),

  createShippingMethod: (body: CreateShippingMethodBody) =>
    http.post<SuccessResponse<ShippingMethod>>('admin/shipping-methods', body),

  updateShippingMethod: (id: string, body: UpdateShippingMethodBody) =>
    http.put<SuccessResponse<ShippingMethod>>(`admin/shipping-methods/${id}`, body),

  deleteShippingMethod: (id: string) =>
    http.delete<SuccessResponse<null>>(`admin/shipping-methods/${id}`),

  toggleShippingMethod: (id: string) =>
    http.patch<SuccessResponse<ShippingMethod>>(`admin/shipping-methods/${id}/toggle`),

  reorderShippingMethods: (items: ReorderShippingItem[]) =>
    http.put<SuccessResponse<null>>('admin/shipping-methods/reorder', { items }),
}

export default shippingApi
