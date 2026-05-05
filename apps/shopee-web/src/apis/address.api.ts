import { SuccessResponseApi } from 'src/types/utils.type'
import { Address, AddressFormData, AddressListResponse } from 'src/types/checkout.type'
import http from 'src/utils/http'

const addressApi = {
  getAddresses: () => {
    return http.get<SuccessResponseApi<AddressListResponse>>('/addresses')
  },

  getAddressById: (id: string) => {
    return http.get<SuccessResponseApi<Address>>(`/addresses/${id}`)
  },

  createAddress: (body: AddressFormData) => {
    return http.post<SuccessResponseApi<Address>>('/addresses', body)
  },

  updateAddress: (id: string, body: Partial<AddressFormData>) => {
    return http.put<SuccessResponseApi<Address>>(`/addresses/${id}`, body)
  },

  deleteAddress: (id: string) => {
    return http.delete<SuccessResponseApi<{ message: string }>>(`/addresses/${id}`)
  },

  setDefaultAddress: (id: string) => {
    return http.put<SuccessResponseApi<Address>>(`/addresses/${id}/default`)
  },
}

export default addressApi
