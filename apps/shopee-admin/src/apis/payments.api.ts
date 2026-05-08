import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'
import type { PaymentMethod, CreatePaymentMethodBody, UpdatePaymentMethodBody, ReorderPaymentItem } from 'src/types/payment.types'

const paymentsApi = {
  // ─── User-facing ────────────────────────────────────────────────
  getPaymentMethods: () =>
    http.get<SuccessResponse<PaymentMethod[]>>('orders/payment/methods'),

  // ─── Admin CRUD ──────────────────────────────────────────────────
  getAdminPaymentMethods: () =>
    http.get<SuccessResponse<PaymentMethod[]>>('admin/payment-methods'),

  getAdminPaymentMethodById: (id: string) =>
    http.get<SuccessResponse<PaymentMethod>>(`admin/payment-methods/${id}`),

  createPaymentMethod: (body: CreatePaymentMethodBody) =>
    http.post<SuccessResponse<PaymentMethod>>('admin/payment-methods', body),

  updatePaymentMethod: (id: string, body: UpdatePaymentMethodBody) =>
    http.put<SuccessResponse<PaymentMethod>>(`admin/payment-methods/${id}`, body),

  deletePaymentMethod: (id: string) =>
    http.delete<SuccessResponse<null>>(`admin/payment-methods/${id}`),

  togglePaymentMethod: (id: string) =>
    http.patch<SuccessResponse<PaymentMethod>>(`admin/payment-methods/${id}/toggle`),

  reorderPaymentMethods: (items: ReorderPaymentItem[]) =>
    http.put<SuccessResponse<null>>('admin/payment-methods/reorder', { items }),
}

export default paymentsApi
