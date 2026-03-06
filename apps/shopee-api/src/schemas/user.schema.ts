import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * User ID param schema
 */
export const userIdParamSchema = z.object({
  params: z.object({
    user_id: mongoIdSchema.refine((val) => val, {
      message: 'user_id không đúng định dạng MongoDB ObjectId',
    }),
  }),
})

/**
 * Add user schema (admin)
 * Validates creating a new user
 */
export const addUserSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email không đúng định dạng')
      .min(6, 'Email phải từ 6-160 kí tự')
      .max(160, 'Email phải từ 6-160 kí tự'),
    name: z
      .string()
      .min(1, 'Tên không được để trống')
      .max(160, 'Tên phải ít hơn 160 kí tự'),
    password: z
      .string()
      .min(6, 'Mật khẩu phải từ 6-160 kí tự')
      .max(160, 'Mật khẩu phải từ 6-160 kí tự'),
    date_of_birth: z
      .string()
      .datetime({ message: 'Ngày sinh không đúng định dạng' })
      .optional(),
    address: z
      .string()
      .max(160, 'Địa chỉ phải ít hơn 160 kí tự')
      .optional(),
    phone: z
      .string()
      .max(20, 'SDT không được lớn hơn 20 kí tự')
      .optional(),
    roles: z
      .array(z.string())
      .min(1, 'Phân quyền không được để trống'),
    avatar: z
      .string()
      .max(1000, 'URL avatar không được lớn hơn 1000 ký tự')
      .optional(),
  }),
})

/**
 * Update user schema (admin)
 * All fields optional for partial updates
 */
export const updateUserSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Tên không được để trống')
      .max(160, 'Tên phải ít hơn 160 kí tự')
      .optional(),
    date_of_birth: z
      .string()
      .datetime({ message: 'Ngày sinh không đúng định dạng' })
      .optional(),
    address: z
      .string()
      .max(160, 'Địa chỉ phải ít hơn 160 kí tự')
      .optional(),
    phone: z
      .string()
      .max(20, 'SDT phải ít hơn 20 kí tự')
      .optional(),
    roles: z
      .array(z.string())
      .optional(),
    avatar: z
      .string()
      .max(1000, 'URL avatar không được lớn hơn 1000 ký tự')
      .optional(),
    password: z
      .string()
      .min(6, 'Mật khẩu phải từ 6-160 kí tự')
      .max(160, 'Mật khẩu phải từ 6-160 kí tự')
      .optional(),
    new_password: z
      .string()
      .min(6, 'Mật khẩu mới phải từ 6-160 kí tự')
      .max(160, 'Mật khẩu mới phải từ 6-160 kí tự')
      .optional(),
  }),
})

/**
 * Update profile schema (user self-update)
 */
export const updateMeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .max(160, 'Tên phải ít hơn 160 kí tự')
      .optional(),
    date_of_birth: z
      .string()
      .datetime({ message: 'Ngày sinh không đúng định dạng' })
      .optional(),
    address: z
      .string()
      .max(160, 'Địa chỉ phải ít hơn 160 kí tự')
      .optional(),
    phone: z
      .string()
      .max(20, 'SDT phải ít hơn 20 kí tự')
      .optional(),
    avatar: z
      .string()
      .max(1000, 'URL avatar không được lớn hơn 1000 ký tự')
      .optional(),
    password: z
      .string()
      .min(6, 'Mật khẩu phải từ 6-160 kí tự')
      .max(160, 'Mật khẩu phải từ 6-160 kí tự')
      .optional(),
    new_password: z
      .string()
      .min(6, 'Mật khẩu mới phải từ 6-160 kí tự')
      .max(160, 'Mật khẩu mới phải từ 6-160 kí tự')
      .optional(),
  }),
})

// Type exports
export type AddUserInput = z.infer<typeof addUserSchema>['body']
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body']
export type UpdateMeInput = z.infer<typeof updateMeSchema>['body']

