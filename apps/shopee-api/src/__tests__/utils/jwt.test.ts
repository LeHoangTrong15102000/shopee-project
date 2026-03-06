/// <reference types="jest" />

import jwt from 'jsonwebtoken'
import { signToken, verifyToken } from '@utils/jwt'
import { STATUS } from '@constants/status'
import { ErrorHandler } from '@utils/response'

const SECRET_KEY = 'test-secret-key'

describe('jwt utils', () => {
  describe('signToken', () => {
    it('returns a JWT token string', async () => {
      const token = (await signToken({ userId: '123' }, SECRET_KEY, '1h')) as string
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('token contains the payload when decoded', async () => {
      const payload = { userId: '123', role: 'admin' }
      const token = (await signToken(payload, SECRET_KEY, '1h')) as string
      const decoded = jwt.decode(token) as Record<string, unknown>
      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.role).toBe(payload.role)
    })
  })

  describe('verifyToken', () => {
    it('valid token returns decoded payload', async () => {
      const payload = { userId: '456' }
      const token = (await signToken(payload, SECRET_KEY, '1h')) as string
      const decoded = (await verifyToken(token, SECRET_KEY)) as Record<string, unknown>
      expect(decoded.userId).toBe(payload.userId)
    })

    it('expired token rejects with ErrorHandler having status 401 and error.name EXPIRED_TOKEN', async () => {
      const token = jwt.sign({ userId: '789' }, SECRET_KEY, { expiresIn: '0s' })

      await expect(verifyToken(token, SECRET_KEY)).rejects.toMatchObject({
        status: STATUS.UNAUTHORIZED,
        error: { name: 'EXPIRED_TOKEN' }
      })
    })

    it('invalid/tampered token rejects with ErrorHandler having status 401', async () => {
      const tamperedToken = 'invalid.token.here'

      await expect(verifyToken(tamperedToken, SECRET_KEY)).rejects.toMatchObject({
        status: STATUS.UNAUTHORIZED
      })
    })
  })
})

