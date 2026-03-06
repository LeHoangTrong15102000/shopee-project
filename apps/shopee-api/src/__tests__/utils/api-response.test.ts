/// <reference types="jest" />
import { Response } from 'express'
import { ApiResponse } from '@utils/api-response'
import { createMockResponse } from '../setup'
import { STATUS } from '@constants/status'
import { COMMON_MESSAGES } from '@constants/messages'

describe('ApiResponse', () => {
  let res: Partial<Response>

  beforeEach(() => {
    res = createMockResponse()
  })

  describe('success', () => {
    it('sends 200 with data and default message', () => {
      const data = { id: 1, name: 'Test' }
      ApiResponse.success(res as Response, data)
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({ message: COMMON_MESSAGES.SUCCESS, data })
    })

    it('sends custom status code and message', () => {
      const data = { id: 1 }
      ApiResponse.success(res as Response, data, 'Custom message', 201)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ message: 'Custom message', data })
    })
  })

  describe('error', () => {
    it('sends 400 with message', () => {
      ApiResponse.error(res as Response, 'Error message')
      expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      expect(res.json).toHaveBeenCalledWith({ message: 'Error message' })
    })

    it('sends with errors object in data field', () => {
      const errors = { email: 'Invalid email' }
      ApiResponse.error(res as Response, 'Validation failed', 400, errors)
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed', data: errors })
    })
  })

  describe('paginated', () => {
    it('sends 200 with data array and pagination', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const pagination = { page: 1, limit: 10, page_size: 2 }
      ApiResponse.paginated(res as Response, data, pagination)
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: COMMON_MESSAGES.SUCCESS,
        data,
        pagination,
      })
    })
  })

  describe('created', () => {
    it('sends 201', () => {
      const data = { id: 1 }
      ApiResponse.created(res as Response, data)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ message: COMMON_MESSAGES.CREATED, data })
    })
  })

  describe('noContent', () => {
    it('sends 204', () => {
      ApiResponse.noContent(res as Response)
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })
  })

  describe('unauthorized', () => {
    it('sends 401', () => {
      ApiResponse.unauthorized(res as Response)
      expect(res.status).toHaveBeenCalledWith(STATUS.UNAUTHORIZED)
      expect(res.json).toHaveBeenCalledWith({ message: 'Bạn không có quyền truy cập' })
    })
  })

  describe('forbidden', () => {
    it('sends 403', () => {
      ApiResponse.forbidden(res as Response)
      expect(res.status).toHaveBeenCalledWith(STATUS.FORBIDDEN)
      expect(res.json).toHaveBeenCalledWith({ message: 'Bạn không có quyền thực hiện hành động này' })
    })
  })

  describe('notFound', () => {
    it('sends 404', () => {
      ApiResponse.notFound(res as Response)
      expect(res.status).toHaveBeenCalledWith(STATUS.NOT_FOUND)
      expect(res.json).toHaveBeenCalledWith({ message: COMMON_MESSAGES.NOT_FOUND })
    })
  })

  describe('validationError', () => {
    it('sends 422 with errors', () => {
      const errors = { email: 'Required', password: 'Too short' }
      ApiResponse.validationError(res as Response, errors)
      expect(res.status).toHaveBeenCalledWith(STATUS.UNPROCESSABLE_ENTITY)
      expect(res.json).toHaveBeenCalledWith({
        message: COMMON_MESSAGES.VALIDATION_ERROR,
        data: errors,
      })
    })
  })
})

