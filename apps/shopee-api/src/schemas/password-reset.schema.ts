import { z } from 'zod'

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
  body: z.object({
    token: z.string().min(1, 'Token là bắt buộc'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirm_password: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
  }).refine((data) => data.password === data.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  }),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

