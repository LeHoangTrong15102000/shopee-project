import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { categoryService } from '../container'
import { NotFoundError, ValidationError, ConflictError } from '@services/base.service'

const addCategory = async (req: Request, res: Response) => {
  try {
    const name: string = req.body.name
    const category = await categoryService.createCategory({ name })
    const response = {
      message: 'Tạo Category thành công',
      data: category,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof ConflictError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    throw error
  }
}

const getCategories = async (req: Request, res: Response) => {
  const { exclude } = req.query
  const categories = await categoryService.getCategories(exclude as string | undefined)
  const response = {
    message: 'Lấy categories thành công',
    data: categories,
  }
  return responseSuccess(res, response)
}

const getCategory = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.getCategoryById(req.params.category_id as string)
    const response = {
      message: 'Lấy category thành công',
      data: category,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không tìm thấy Category')
    }
    throw error
  }
}

const updateCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body
    const category = await categoryService.updateCategory(req.params.category_id as string, {
      name,
    })
    const response = {
      message: 'Cập nhật category thành công',
      data: category,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không tìm thấy Category')
    }
    if (error instanceof ConflictError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    throw error
  }
}

const deleteCategory = async (req: Request, res: Response) => {
  try {
    await categoryService.deleteCategory(req.params.category_id as string)
    return responseSuccess(res, { message: 'Xóa thành công' })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không tìm thấy Category')
    }
    throw error
  }
}

const categoryController = {
  addCategory,
  getCategory,
  getCategories,
  updateCategory,
  deleteCategory,
}

export default categoryController
