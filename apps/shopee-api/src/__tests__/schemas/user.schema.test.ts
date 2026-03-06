/// <reference types="jest" />
import { userIdParamSchema, addUserSchema, updateUserSchema, updateMeSchema } from '@schemas/user.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('addUserSchema', () => {
  const validData = {
    body: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      roles: ['user'],
    },
  }

  it('should pass with valid data', () => {
    expect(() => addUserSchema.parse(validData)).not.toThrow()
  })

  it('should fail when email is missing', () => {
    const { email, ...rest } = validData.body
    expect(() => addUserSchema.parse({ body: rest })).toThrow()
  })

  it('should fail with invalid email format', () => {
    expect(() => addUserSchema.parse({ body: { ...validData.body, email: 'invalid' } })).toThrow()
  })

  it('should fail when name is missing', () => {
    const { name, ...rest } = validData.body
    expect(() => addUserSchema.parse({ body: rest })).toThrow()
  })

  it('should fail with empty name', () => {
    expect(() => addUserSchema.parse({ body: { ...validData.body, name: '' } })).toThrow()
  })

  it('should fail when password is too short', () => {
    expect(() => addUserSchema.parse({ body: { ...validData.body, password: '12345' } })).toThrow()
  })

  it('should fail when roles is missing', () => {
    const { roles, ...rest } = validData.body
    expect(() => addUserSchema.parse({ body: rest })).toThrow()
  })

  it('should fail with empty roles array', () => {
    expect(() => addUserSchema.parse({ body: { ...validData.body, roles: [] } })).toThrow()
  })

  it('should fail with invalid date_of_birth format', () => {
    expect(() => addUserSchema.parse({ body: { ...validData.body, date_of_birth: 'invalid-date' } })).toThrow()
  })

  it('should fail when phone is too long', () => {
    expect(() => addUserSchema.parse({ body: { ...validData.body, phone: '123456789012345678901' } })).toThrow()
  })
})

describe('updateUserSchema', () => {
  it('should pass with empty body (all fields optional)', () => {
    expect(() => updateUserSchema.parse({ body: {} })).not.toThrow()
  })

  it('should pass with partial update', () => {
    expect(() => updateUserSchema.parse({ body: { name: 'Updated Name' } })).not.toThrow()
  })

  it('should fail with invalid date_of_birth format', () => {
    expect(() => updateUserSchema.parse({ body: { date_of_birth: 'invalid-date' } })).toThrow()
  })
})

describe('updateMeSchema', () => {
  it('should pass with empty body', () => {
    expect(() => updateMeSchema.parse({ body: {} })).not.toThrow()
  })

  it('should pass with valid name', () => {
    expect(() => updateMeSchema.parse({ body: { name: 'New Name' } })).not.toThrow()
  })

  it('should pass with password change fields', () => {
    expect(() => updateMeSchema.parse({ body: { password: 'oldpass123', new_password: 'newpass123' } })).not.toThrow()
  })

  it('should fail with short password', () => {
    expect(() => updateMeSchema.parse({ body: { password: '12345' } })).toThrow()
  })

  it('should fail with short new_password', () => {
    expect(() => updateMeSchema.parse({ body: { new_password: '12345' } })).toThrow()
  })
})

describe('userIdParamSchema', () => {
  it('should pass with valid MongoDB ID', () => {
    expect(() => userIdParamSchema.parse({ params: { user_id: VALID_ID } })).not.toThrow()
  })

  it('should fail with invalid MongoDB ID', () => {
    expect(() => userIdParamSchema.parse({ params: { user_id: 'invalid-id' } })).toThrow()
  })
})

