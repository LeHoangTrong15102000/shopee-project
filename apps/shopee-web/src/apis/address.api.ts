import { SuccessResponseApi } from 'src/types/utils.type'
import { Address, AddressFormData, AddressListResponse } from 'src/types/checkout.type'
import http from 'src/utils/http'

const addressApi = {
  getAddresses: async () => {
    return http.get<SuccessResponseApi<AddressListResponse>>('/addresses')
  },

  getAddressById: async (id: string) => {
    return http.get<SuccessResponseApi<Address>>(`/addresses/${id}`)
  },

  createAddress: async (body: AddressFormData) => {
    return http.post<SuccessResponseApi<Address>>('/addresses', body)
  },

  updateAddress: async (id: string, body: Partial<AddressFormData>) => {
    return http.put<SuccessResponseApi<Address>>(`/addresses/${id}`, body)
  },

  deleteAddress: async (id: string) => {
    return http.delete<SuccessResponseApi<{ message: string }>>(`/addresses/${id}`)
  },

  setDefaultAddress: async (id: string) => {
    return http.put<SuccessResponseApi<Address>>(`/addresses/${id}/default`)
  },
}

export default addressApi
