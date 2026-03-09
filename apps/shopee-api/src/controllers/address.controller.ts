import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { STATUS } from '@constants/status'
import { container } from '../container'

const addressService = container.services.address

export const getAddresses = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id

  const result = await addressService.getAddresses(user_id!)

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách địa chỉ thành công',
    data: {
      addresses: result.addresses,
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
    data: address,
  })
}

export const createAddress = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const { full_name, phone, province, district, ward, street, is_default } = req.body

  const address = await addressService.createAddress(user_id!, {
    full_name,
    phone,
    province,
    district,
    ward,
    street,
    is_default,
  })

  res.status(STATUS.OK).json({
    message: 'Tạo địa chỉ thành công',
    data: address,
  })
}

export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { id } = req.params as Record<string, string>
  const { full_name, phone, province, district, ward, street, is_default } = req.body

  const address = await addressService.updateAddress(user_id!, id, {
    full_name,
    phone,
    province,
    district,
    ward,
    street,
    is_default,
  })

  res.status(STATUS.OK).json({
    message: 'Cập nhật địa chỉ thành công',
    data: address,
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
    data: address,
  })
}

