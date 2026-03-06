import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { orderService } from '../container'
import { ValidationError, NotFoundError } from '@services/base.service'

export const getTracking = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy thông tin tracking cho đơn hàng này' })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi lấy thông tin tracking',
    })
  }
}

export const getTrackingByNumber = async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params

    const tracking = await orderService.getTrackingByNumber(trackingNumber)

    res.status(STATUS.OK).json({
      message: 'Lấy thông tin tracking thành công',
      data: tracking,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy thông tin tracking' })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi lấy thông tin tracking',
    })
  }
}

