/// <reference types="jest" />
import { Request, Response } from 'express'

jest.mock('../../container', () => ({
  container: {
    services: {
      passwordReset: {
        forgotPassword: jest.fn(),
        resetPassword: jest.fn(),
      },
    },
  },
}))

const { container } = require('../../container')
import { forgotPassword, resetPassword } from '../../controllers/password-reset.controller'

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Password Reset Controller', () => {
  beforeEach(() => jest.clearAllMocks())

  it('forgotPassword success', async () => {
    container.services.passwordReset.forgotPassword.mockResolvedValue({ message: 'Email sent' })
    const req = createMockRequest({ body: { email: 'user@example.com' } })
    const res = createMockResponse()
    await forgotPassword(req as Request, res as Response)
    expect(container.services.passwordReset.forgotPassword).toHaveBeenCalledWith('user@example.com')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Email sent' })
  })

  it('forgotPassword throws on error', async () => {
    container.services.passwordReset.forgotPassword.mockRejectedValue(new Error('Invalid email'))
    const req = createMockRequest({ body: { email: 'bad' } })
    const res = createMockResponse()
    await expect(forgotPassword(req as Request, res as Response)).rejects.toThrow()
  })

  it('resetPassword success', async () => {
    container.services.passwordReset.resetPassword.mockResolvedValue({ message: 'Password reset' })
    const req = createMockRequest({ body: { token: 'valid-token', password: 'newPass123' } })
    const res = createMockResponse()
    await resetPassword(req as Request, res as Response)
    expect(container.services.passwordReset.resetPassword).toHaveBeenCalledWith('valid-token', 'newPass123')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Password reset' })
  })

  it('resetPassword throws on error', async () => {
    container.services.passwordReset.resetPassword.mockRejectedValue(new Error('Invalid token'))
    const req = createMockRequest({ body: { token: 'bad', password: 'x' } })
    const res = createMockResponse()
    await expect(resetPassword(req as Request, res as Response)).rejects.toThrow()
  })
})
