import { z } from 'zod'

/**
 * Strong password validation schema
 * - Length: 8-160 characters
 * - Must contain at least one uppercase letter
 * - Must contain at least one lowercase letter
 * - Must contain at least one number
 * - Must contain at least one special character
 */
const strongPasswordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 kí tự')
  .max(160, 'Mật khẩu không được vượt quá 160 kí tự')
  .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất một chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một chữ số')
  .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt')

/**
 * Forgot password request body validation
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ'),
  }),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * Reset password request body validation
 */
export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(1, 'Token là bắt buộc'),
      password: strongPasswordSchema,
      confirm_password: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: 'Mật khẩu xác nhận không khớp',
      path: ['confirm_password'],
    }),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * Set password request body validation (for accounts without a user-chosen password, e.g. Google OAuth)
 * No current_password field — the active session is proof of identity.
 */
export const setPasswordSchema = z.object({
  body: z
    .object({
      new_password: strongPasswordSchema,
      confirm_password: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: 'Mật khẩu xác nhận không khớp',
      path: ['confirm_password'],
    }),
})

export type SetPasswordInput = z.infer<typeof setPasswordSchema>
