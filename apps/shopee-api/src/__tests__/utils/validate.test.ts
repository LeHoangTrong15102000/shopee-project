/// <reference types="jest" />

import { Request } from 'express'
import mongoose from 'mongoose'
import { isEmail, isAdmin, isMongoId } from '@utils/validate'

describe('validate utils', () => {
  describe('isEmail', () => {
    it('returns true for valid email', () => {
      expect(isEmail('testuser@gmail.com')).toBe(true)
    })

    it('returns false when email starts with number', () => {
      expect(isEmail('1test@gmail.com')).toBe(false)
    })

    it('returns false when no domain', () => {
      expect(isEmail('test@')).toBe(false)
    })

    it('returns false when local part too short', () => {
      expect(isEmail('ab@gmail.com')).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('returns true when admin role present', () => {
      const req = { jwtDecoded: { roles: ['Admin'] } } as unknown as Request
      expect(isAdmin(req)).toBe(true)
    })

    it('returns false when no admin role', () => {
      const req = { jwtDecoded: { roles: ['User'] } } as unknown as Request
      expect(isAdmin(req)).toBe(false)
    })

    it('returns undefined when no jwtDecoded', () => {
      const req = {} as Request
      expect(isAdmin(req)).toBeUndefined()
    })
  })

  describe('isMongoId', () => {
    it('returns true for valid ObjectId string', () => {
      const validId = new mongoose.Types.ObjectId().toString()
      expect(isMongoId(validId)).toBe(true)
    })

    it('returns false for invalid string', () => {
      expect(isMongoId('invalid-id')).toBe(false)
    })
  })
})

