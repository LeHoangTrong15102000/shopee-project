import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { STATUS } from '@constants/status'
import { container } from '../container'
import {
  CreateAddressDTO,
  IAddressItem,
} from '../repositories/interfaces/address.repository.interface'

const addressService = container.services.address

/**
 * Shape of the address body the web client sends (camelCase). All fields are
 * optional here because update requests are partial; presence/format is
 * enforced by the schema and service layers.
 */
interface AddressBody {
  fullName?: string
  full_name?: string
  phone?: string
  province?: string
  provinceId?: string
  province_id?: string
  district?: string
  districtId?: string
  district_id?: string
  ward?: string
  wardId?: string
  ward_id?: string
  street?: string
  isDefault?: boolean
  is_default?: boolean
  addressType?: string
  address_type?: string
  label?: string
}

/**
 * Map an incoming request body (camelCase from the web client) to the
 * snake_case shape the service/repository/Mongoose model expect.
 * Single-word fields (phone, province, district, ward, street) are shared.
 */
function mapBodyToSnake(body: AddressBody) {
  return {
    full_name: body.fullName ?? body.full_name,
    phone: body.phone,
    province: body.province,
    province_id: body.provinceId ?? body.province_id,
    district: body.district,
    district_id: body.districtId ?? body.district_id,
    ward: body.ward,
    ward_id: body.wardId ?? body.ward_id,
    street: body.street,
    is_default: body.isDefault ?? body.is_default,
    address_type: body.addressType ?? body.address_type,
    label: body.label,
  }
}

/**
 * Map a stored snake_case address document to the camelCase shape the web
 * client reads (addr.fullName, addr.userId, addr.isDefault, ...).
 */
function mapAddressToCamel(address: IAddressItem | null) {
  if (!address) return address
  return {
    _id: address._id,
    userId: address.user,
    fullName: address.full_name,
    phone: address.phone,
    province: address.province,
    provinceId: address.province_id,
    district: address.district,
    districtId: address.district_id,
    ward: address.ward,
    wardId: address.ward_id,
    street: address.street,
    isDefault: address.is_default,
    addressType: address.address_type,
    label: address.label,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  }
}

export const getAddresses = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id

  const result = await addressService.getAddresses(user_id!)

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách địa chỉ thành công',
    data: {
      addresses: result.addresses.map((a) => mapAddressToCamel(a)),
      total: result.total,
    },
  })
}

export const getAddressById = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { id } = req.params as Record<string, string>

  const address = await addressService.getAddressById(user_id!, id)

  res.status(STATUS.OK).json({
    message: 'Lấy địa chỉ thành công',
    data: mapAddressToCamel(address),
  })
}

export const createAddress = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const data = mapBodyToSnake(req.body)

  const address = await addressService.createAddress(
    user_id!,
    data as Omit<CreateAddressDTO, 'user'>,
  )

  res.status(STATUS.OK).json({
    message: 'Tạo địa chỉ thành công',
    data: mapAddressToCamel(address),
  })
}

export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { id } = req.params as Record<string, string>
  const data = mapBodyToSnake(req.body)

  const address = await addressService.updateAddress(user_id!, id, data)

  res.status(STATUS.OK).json({
    message: 'Cập nhật địa chỉ thành công',
    data: mapAddressToCamel(address),
  })
}

export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { id } = req.params as Record<string, string>

  await addressService.deleteAddress(user_id!, id)

  res.status(STATUS.OK).json({
    message: 'Xóa địa chỉ thành công',
  })
}

export const setDefaultAddress = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { id } = req.params as Record<string, string>

  const address = await addressService.setDefaultAddress(user_id!, id)

  res.status(STATUS.OK).json({
    message: 'Đặt địa chỉ mặc định thành công',
    data: mapAddressToCamel(address),
  })
}
