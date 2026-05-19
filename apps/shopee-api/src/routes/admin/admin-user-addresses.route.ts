import { Router } from 'express'
import { Request, Response } from 'express'
import { Types } from 'mongoose'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { container } from '../../container'
import { STATUS } from '@constants/status'

const adminUserAddressesRouter = Router({ mergeParams: true })

adminUserAddressesRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const user_id = req.params.user_id as string
    const addressService = container.services.address

    if (!Types.ObjectId.isValid(user_id)) {
      res.status(STATUS.BAD_REQUEST).json({ message: 'Invalid user ID format' })
      return
    }

    const result = await addressService.getAddresses(user_id)

    res.status(STATUS.OK).json({
      message: 'Lấy danh sách địa chỉ người dùng thành công',
      data: {
        addresses: result.addresses,
        total: result.total,
      },
    })
  }),
)

export default adminUserAddressesRouter
