/**
 * DeviceTokenController — handles device token registration and removal.
 */
import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { container } from '../container'
import { RegisterDeviceTokenInput } from '@schemas/device-token.schema'
import { DevicePlatform } from '@database/models/device-token.model'

export const registerDeviceToken = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded?.id as string
  const body = req.body as RegisterDeviceTokenInput

  const token = await container.services.deviceToken.registerToken(userId, {
    token: body.token,
    platform: body.platform as DevicePlatform,
    deviceName: body.deviceName,
  })

  res.status(STATUS.CREATED).json({
    message: 'Đăng ký device token thành công',
    data: token,
  })
}

export const deleteDeviceToken = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded?.id as string
  const tokenId = req.params.id as string

  const deleted = await container.services.deviceToken.unregisterToken(userId, tokenId)

  res.status(STATUS.OK).json({
    message: 'Xóa device token thành công',
    data: deleted,
  })
}
