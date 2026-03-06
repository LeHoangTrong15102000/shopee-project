import { http, HttpResponse } from 'msw'
import config from 'src/constant/config'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'

const sampleAddresses = [
  {
    _id: 'addr-1',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    address: '126/13 đường 17, khu phố 5',
    ward: 'Phường Linh Trung',
    district: 'Thành phố Thủ Đức',
    city: 'Hồ Chí Minh',
    is_default: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

const getAddressesRequest = http.get(`${config.baseUrl}addresses`, () => {
  return HttpResponse.json(
    { message: 'Lấy danh sách địa chỉ thành công', data: sampleAddresses },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

const createAddressRequest = http.post(`${config.baseUrl}addresses`, async ({ request }) => {
  const body = (await request.json()) as Record<string, unknown>
  return HttpResponse.json(
    { message: 'Thêm địa chỉ thành công', data: { _id: `addr_${Date.now()}`, ...body } },
    { status: HTTP_STATUS_CODE.Created }
  )
})

const updateAddressRequest = http.put(`${config.baseUrl}addresses/:id`, async ({ request }) => {
  const body = (await request.json()) as Record<string, unknown>
  return HttpResponse.json(
    { message: 'Cập nhật địa chỉ thành công', data: { ...sampleAddresses[0], ...body } },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

const deleteAddressRequest = http.delete(`${config.baseUrl}addresses/:id`, () => {
  return HttpResponse.json(
    { message: 'Xóa địa chỉ thành công', data: { deleted_count: 1 } },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

const addressRequests = [getAddressesRequest, createAddressRequest, updateAddressRequest, deleteAddressRequest]

export default addressRequests
