import { http, HttpResponse } from 'msw'
import config from 'src/constant/config'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'
import { gated } from 'src/mocks/mockControl'
import { Address } from 'src/types/checkout.type'

const sampleAddresses: Address[] = [
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
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
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
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
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
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
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
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z',
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
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
]

const getAddressesRequest = gated(
  'address',
  http.get(`${config.baseUrl}addresses`, () => {
    return HttpResponse.json(
      {
        message: 'Lấy danh sách địa chỉ thành công',
        data: { addresses: sampleAddresses, total: sampleAddresses.length },
      },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

const createAddressRequest = gated(
  'address',
  http.post(`${config.baseUrl}addresses`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      { message: 'Thêm địa chỉ thành công', data: { _id: `addr_${Date.now()}`, ...body } },
      { status: HTTP_STATUS_CODE.Created },
    )
  }),
)

const updateAddressRequest = gated(
  'address',
  http.put(`${config.baseUrl}addresses/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      { message: 'Cập nhật địa chỉ thành công', data: { ...sampleAddresses[0], ...body } },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

const deleteAddressRequest = gated(
  'address',
  http.delete(`${config.baseUrl}addresses/:id`, () => {
    return HttpResponse.json(
      { message: 'Xóa địa chỉ thành công', data: { deleted_count: 1 } },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

const addressRequests = [
  getAddressesRequest,
  createAddressRequest,
  updateAddressRequest,
  deleteAddressRequest,
]

export default addressRequests
