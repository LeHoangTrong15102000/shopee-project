import { z } from 'zod'

/**
 * Email validation schema
 * - Must be valid email format
 * - Length: 5-160 characters
 * - Normalized: lowercase and trimmed
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Email không đúng định dạng')
  .min(5, 'Email phải từ 5-160 kí tự')
  .max(160, 'Email phải từ 5-160 kí tự')

/**
 * Password validation schema
 * - Length: 8-160 characters (increased from 6 for better security)
 * - Must contain at least one uppercase letter
 * - Must contain at least one lowercase letter
 * - Must contain at least one number
 * - Must contain at least one special character
 */
const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 kí tự')
  .max(160, 'Mật khẩu không được vượt quá 160 kí tự')
  .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất một chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một chữ số')
  .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt')

/**
 * Login schema
 * Validates email and password for login
 */
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Mật khẩu không được để trống'),
  }),
})

/**
 * Register schema
 * Validates email and password for registration
 * Password is required and must meet strength requirements
 */
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>['body']
export type RegisterInput = z.infer<typeof registerSchema>['body']

/**
 * Google login schema
 * Validates that id_token is a non-empty string
 */
export const googleLoginSchema = z.object({
  body: z.object({
    id_token: z.string().min(1, 'Google ID token is required'),
  }),
})

/**
 * Google exchange-code schema (web OAuth server flow)
 * Validates that tmp (one-time opaque handle) is a non-empty string
 */
export const googleExchangeCodeSchema = z.object({
  body: z.object({
    tmp: z.string().min(1, 'tmp is required'),
  }),
})
