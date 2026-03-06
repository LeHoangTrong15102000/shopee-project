import { SuccessResponseApi } from 'src/types/utils.type'
import { Address, AddressFormData, AddressListResponse } from 'src/types/checkout.type'
import http from 'src/utils/http'

// Mock data for fallback when API is not available
const mockAddresses: Address[] = [
  {
    _id: '1',
    userId: 'user1',
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    street: '123 Đường Lê Lợi',
    addressType: 'home',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    userId: 'user1',
    fullName: 'Nguyễn Văn A',
    phone: '0909876543',
    province: 'Hồ Chí Minh',
    district: 'Quận 7',
    ward: 'Phường Tân Phú',
    street: '456 Đường Nguyễn Văn Linh',
    addressType: 'home',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '3',
    userId: 'user1',
    fullName: 'Trần Thị B',
    phone: '0912345678',
    province: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    ward: 'Phường Dịch Vọng',
    street: '789 Đường Xuân Thủy',
    addressType: 'office',
    label: 'Văn phòng công ty',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '4',
    userId: 'user1',
    fullName: 'Lê Văn C',
    phone: '0923456789',
    province: 'Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Thạch Thang',
    street: '321 Đường Nguyễn Văn Linh',
    addressType: 'home',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '5',
    userId: 'user1',
    fullName: 'Phạm Thị D',
    phone: '0934567890',
    province: 'Cần Thơ',
    district: 'Quận Ninh Kiều',
    ward: 'Phường An Hòa',
    street: '654 Đường 30 Tháng 4',
    addressType: 'other',
    label: 'Nhà bà ngoại',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

const addressApi = {
  getAddresses: async () => {
    try {
      const response = await http.get<SuccessResponseApi<AddressListResponse>>('/addresses')
      return response
    } catch (error) {
      console.warn('⚠️ [getAddresses] API not available, using mock data')
      return {
        data: {
          message: 'Lấy danh sách địa chỉ thành công (mock)',
          data: { addresses: mockAddresses, total: mockAddresses.length }
        }
      }
    }
  },

  getAddressById: async (id: string) => {
    try {
      const response = await http.get<SuccessResponseApi<Address>>(`/addresses/${id}`)
      return response
    } catch (error) {
      console.warn('⚠️ [getAddressById] API not available, using mock data')
      const address = mockAddresses.find((a) => a._id === id)
      return {
        data: {
          message: 'Lấy địa chỉ thành công (mock)',
          data: address || mockAddresses[0]
        }
      }
    }
  },

  createAddress: async (body: AddressFormData) => {
    try {
      const response = await http.post<SuccessResponseApi<Address>>('/addresses', body)
      return response
    } catch (error) {
      console.warn('⚠️ [createAddress] API not available, using mock data')
      const newAddress: Address = {
        _id: Date.now().toString(),
        userId: 'user1',
        ...body,
        isDefault: body.isDefault || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return {
        data: {
          message: 'Tạo địa chỉ thành công (mock)',
          data: newAddress
        }
      }
    }
  },

  updateAddress: async (id: string, body: Partial<AddressFormData>) => {
    try {
      const response = await http.put<SuccessResponseApi<Address>>(`/addresses/${id}`, body)
      return response
    } catch (error) {
      console.warn('⚠️ [updateAddress] API not available, using mock data')
      const address = mockAddresses.find((a) => a._id === id)
      return {
        data: {
          message: 'Cập nhật địa chỉ thành công (mock)',
          data: { ...address, ...body } as Address
        }
      }
    }
  },

  deleteAddress: async (id: string) => {
    try {
      const response = await http.delete<SuccessResponseApi<{ message: string }>>(`/addresses/${id}`)
      return response
    } catch (error) {
      console.warn('⚠️ [deleteAddress] API not available, using mock data')
      return {
        data: {
          message: 'Xóa địa chỉ thành công (mock)',
          data: { message: 'Xóa địa chỉ thành công (mock)' }
        }
      }
    }
  },

  setDefaultAddress: async (id: string) => {
    try {
      const response = await http.put<SuccessResponseApi<Address>>(`/addresses/${id}/default`)
      return response
    } catch (error) {
      console.warn('⚠️ [setDefaultAddress] API not available, using mock data')
      const address = mockAddresses.find((a) => a._id === id)
      return {
        data: {
          message: 'Đặt địa chỉ mặc định thành công (mock)',
          data: { ...address, isDefault: true } as Address
        }
      }
    }
  }
}

export default addressApi
