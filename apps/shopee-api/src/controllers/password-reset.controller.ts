import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { container } from '../container'

const passwordResetService = container.services.passwordReset

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body

  const result = await passwordResetService.forgotPassword(email)

  res.status(STATUS.OK).json({
    message: result.message,
  })
}

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body

  const result = await passwordResetService.resetPassword(token, password)

  res.status(STATUS.OK).json({
    message: result.message,
  })
}
