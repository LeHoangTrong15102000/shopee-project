import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { STATUS } from '@constants/status'
import { orderService } from '../container'

export const getTracking = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const { order_id } = req.query

  if (!order_id) {
    res.status(STATUS.BAD_REQUEST).json({
      message: 'order_id là bắt buộc',
    })
    return
  }

  const tracking = await orderService.getTracking(user_id!, order_id as string)

  res.status(STATUS.OK).json({
    message: 'Lấy thông tin tracking thành công',
    data: tracking,
  })
}

export const getTrackingByNumber = async (req: Req, res: Response) => {
  const { trackingNumber } = req.params

  const tracking = await orderService.getTrackingByNumber(trackingNumber)

  res.status(STATUS.OK).json({
    message: 'Lấy thông tin tracking thành công',
    data: tracking,
  })
}
