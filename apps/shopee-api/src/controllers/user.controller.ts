import { FOLDERS } from '@constants/config'
import { STATUS } from '@constants/status'
import { ConflictError, NotFoundError, ValidationError } from '@services/base.service'
import { ErrorHandler, responseSuccess } from '@utils/response'
import { uploadFile } from '@utils/upload'
import { Request, Response } from 'express'
import { userService } from '../container'
type Req = Request<Record<string, string>>

// Local type definitions for this file only
interface User {
  email: string
  password: string
  name: string
  date_of_birth: string
  address: string
  phone: string
  roles: string[]
  avatar?: string
  new_password?: string
}

interface CustomRequest extends Req {
  jwtDecoded: {
    id: string
    email: string
    roles: string[]
    created_at: string
    jti?: string
  }
}

const addUser = async (req: CustomRequest, res: Response) => {
  try {
    const form: User = req.body
    const { email, password, address, date_of_birth, name, phone, roles, avatar } = form
    const user = await userService.createUser({
      email,
      password,
      address,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
      name,
      phone,
      roles,
      avatar,
    })
    const response = {
      message: 'Tạo người dùng thành công',
      data: user,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof ConflictError) {
      throw new ErrorHandler(422, { email: error.message })
    }
    throw error
  }
}

const getUsers = async (req: CustomRequest, res: Response) => {
  const users = await userService.getUsers()
  const response = {
    message: 'Lấy người dùng thành công',
    data: users,
  }
  return responseSuccess(res, response)
}

const getDetailMySelf = async (req: CustomRequest, res: Response) => {
  try {
    // Defensive check for missing jwtDecoded or id
    if (!req.jwtDecoded || !req.jwtDecoded.id) {
      throw new ErrorHandler(
        STATUS.UNAUTHORIZED,
        'Token không hợp lệ hoặc thiếu thông tin người dùng',
      )
    }

    const profile = await userService.getProfile(req.jwtDecoded.id)
    const response = {
      message: 'Lấy người dùng thành công',
      data: profile,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.UNAUTHORIZED, 'Không tìm thấy người dùng')
    }
    throw error
  }
}

const getUser = async (req: CustomRequest, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.user_id)
    const response = {
      message: 'Lấy người dùng thành công',
      data: user,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không tìm thấy người dùng')
    }
    throw error
  }
}

const updateUser = async (req: CustomRequest, res: Response) => {
  try {
    const form: User = req.body
    const { password, address, date_of_birth, name, phone, roles, avatar } = form
    const user = await userService.updateUser(req.params.user_id, {
      password,
      address,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
      name,
      phone,
      roles,
      avatar,
    })
    const response = {
      message: 'Cập nhật người dùng thành công',
      data: user,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không tìm thấy người dùng')
    }
    throw error
  }
}

const uploadAvatar = async (req: CustomRequest, res: Response) => {
  const path = await uploadFile(req, FOLDERS.AVATAR)
  const response = {
    message: 'Upload ảnh đại diện thành công',
    data: path,
  }
  return responseSuccess(res, response)
}

const updateMe = async (req: CustomRequest, res: Response) => {
  try {
    // Defensive check for missing jwtDecoded or id
    if (!req.jwtDecoded || !req.jwtDecoded.id) {
      throw new ErrorHandler(
        STATUS.UNAUTHORIZED,
        'Token không hợp lệ hoặc thiếu thông tin người dùng',
      )
    }

    const form: User = req.body
    const { email, password, new_password, address, date_of_birth, name, phone, avatar } = form
    const isPasswordChange = !!(password && new_password)

    const { user, tokens } = await userService.updateProfile(
      req.jwtDecoded.id,
      {
        email,
        password,
        new_password,
        address,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
        name,
        phone,
        avatar,
      },
      req.jwtDecoded.jti,
    )

    // Audit log: user.password_change when password fields are present (fire-and-forget)
    if (isPasswordChange) {
      const userId = req.jwtDecoded.id
      const forwarded = req.headers['x-forwarded-for']
      const ip =
        typeof forwarded === 'string'
          ? forwarded.split(',')[0].trim()
          : req.ip || req.socket?.remoteAddress || 'unknown'
      const { auditLogService } = await import('../container')
      auditLogService.writeLog({
        action: 'user.password_change',
        resource: 'user',
        resourceId: userId,
        actor: { userId, roles: req.jwtDecoded.roles ?? [] },
        ip,
        userAgent: req.headers['user-agent'] || '',
        status: 'success',
      })
    }

    const response = {
      message: 'Cập nhật thông tin thành công',
      data: {
        user,
        ...(isPasswordChange && tokens ? tokens : {}),
      },
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, {
        [error.field || 'password']: error.message,
      })
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không tìm thấy người dùng')
    }
    throw error
  }
}

const deleteUser = async (req: CustomRequest, res: Response) => {
  try {
    await userService.deleteUser(req.params.user_id)
    return responseSuccess(res, { message: 'Xóa thành công' })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không tìm thấy người dùng')
    }
    throw error
  }
}

const setPassword = async (req: CustomRequest, res: Response) => {
  try {
    // Defensive check for missing jwtDecoded or id
    if (!req.jwtDecoded || !req.jwtDecoded.id) {
      throw new ErrorHandler(
        STATUS.UNAUTHORIZED,
        'Token không hợp lệ hoặc thiếu thông tin người dùng',
      )
    }

    const { new_password } = req.body as { new_password: string; confirm_password: string }
    const tokens = await userService.setPassword(
      req.jwtDecoded.id,
      new_password,
      req.jwtDecoded.jti,
    )

    // Audit log: user.password_set (fire-and-forget, mirrors updateMe audit pattern)
    const userId = req.jwtDecoded.id
    const forwarded = req.headers['x-forwarded-for']
    const ip =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip || req.socket?.remoteAddress || 'unknown'
    const { auditLogService } = await import('../container')
    auditLogService.writeLog({
      action: 'user.password_set',
      resource: 'user',
      resourceId: userId,
      actor: { userId, roles: req.jwtDecoded.roles ?? [] },
      ip,
      userAgent: req.headers['user-agent'] || '',
      status: 'success',
    })

    return responseSuccess(res, {
      message: 'Đặt mật khẩu thành công',
      data: tokens ?? {},
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, {
        [error.field || 'new_password']: error.message,
      })
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không tìm thấy người dùng')
    }
    throw error
  }
}

const userController = {
  addUser,
  getUsers,
  getDetailMySelf,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  uploadAvatar,
  setPassword,
}

export default userController
