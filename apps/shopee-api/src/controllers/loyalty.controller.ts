import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { container } from '../container'
import { RewardType, PointsTransactionType } from '@repositories/interfaces/loyalty.repository.interface'

const loyaltyService = container.services.loyalty

export const getPoints = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id

  const result = await loyaltyService.getPoints(user_id!)

  res.status(STATUS.OK).json({
    message: 'Lấy thông tin điểm thành công',
    data: {
      ...result.points,
      tier_info: result.tier_info,
    },
  })
}

export const getTransactions = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const { page = 1, limit = 10, type } = req.query

  const result = await loyaltyService.getTransactions(
    user_id!,
    { type: type as PointsTransactionType | undefined },
    { page: Number(page), limit: Number(limit) }
  )

  res.status(STATUS.OK).json({
    message: 'Lấy lịch sử giao dịch điểm thành công',
    data: {
      transactions: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}

export const getRewards = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, reward_type } = req.query

  const result = await loyaltyService.getRewards(
    { reward_type: reward_type as RewardType | undefined },
    { page: Number(page), limit: Number(limit) }
  )

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách phần thưởng thành công',
    data: {
      rewards: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}

export const redeemPoints = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { rewardId } = req.params

  const result = await loyaltyService.redeemPoints(user_id!, rewardId)

  res.status(STATUS.OK).json({
    message: 'Đổi điểm thành công',
    data: result,
  })
}

