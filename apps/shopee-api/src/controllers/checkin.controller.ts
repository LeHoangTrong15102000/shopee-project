import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { container } from '../container'

const checkinService = container.services.checkin

export const checkIn = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id

  const result = await checkinService.checkIn(user_id!)

  res.status(STATUS.OK).json({
    message: 'Điểm danh thành công',
    data: result,
  })
}

export const getStreak = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id

  const result = await checkinService.getStreak(user_id!)

  res.status(STATUS.OK).json({
    message: 'Lấy thông tin streak thành công',
    data: result,
  })
}

export const getHistory = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const { page = 1, limit = 30 } = req.query

  const result = await checkinService.getHistory(user_id!, {
    page: Number(page),
    limit: Number(limit),
  })

  res.status(STATUS.OK).json({
    message: 'Lấy lịch sử điểm danh thành công',
    data: {
      history: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}
