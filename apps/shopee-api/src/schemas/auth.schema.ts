import { z } from 'zod'

/**
 * Email validation schema
 * - Must be valid email format
 * - Length: 5-160 characters
 */
const emailSchema = z
  .string()
  .email('Email không đúng định dạng')
  .min(5, 'Email phải từ 5-160 kí tự')
  .max(160, 'Email phải từ 5-160 kí tự')

/**
 * Password validation schema
 * - Length: 6-160 characters
 */
const passwordSchema = z
  .string()
  .min(6, 'Mật khẩu phải từ 6-160 kí tự')
  .max(160, 'Mật khẩu phải từ 6-160 kí tự')

/**
 * Login schema
 * Validates email and password for login
 */
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
})

/**
 * Register schema
 * Validates email and password for registration
 * Password is required (cannot be empty)
 */
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z
      .string()
      .min(1, 'Mật khẩu không được để trống')
      .min(6, 'Mật khẩu phải từ 6-160 kí tự')
      .max(160, 'Mật khẩu phải từ 6-160 kí tự'),
  }),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>['body']
export type RegisterInput = z.infer<typeof registerSchema>['body']

