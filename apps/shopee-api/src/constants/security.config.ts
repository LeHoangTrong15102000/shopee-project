/**
 * Cấu hình bảo mật cho ứng dụng
 * Chứa các hằng số liên quan đến security
 */

// Số lần đăng nhập thất bại tối đa trước khi bị khóa
export const MAX_LOGIN_ATTEMPTS = 5

// Thời gian khóa tài khoản sau khi vượt quá số lần đăng nhập thất bại (15 phút)
export const LOGIN_LOCKOUT_TIME = 15 * 60 * 1000

// Kích thước request tối đa cho phép
export const MAX_REQUEST_SIZE = '10mb'

// Số vòng salt cho bcrypt (càng cao càng an toàn nhưng chậm hơn)
export const BCRYPT_SALT_ROUNDS = 12

// Thời gian window cho rate limiting login (15 phút)
export const LOGIN_RATE_LIMIT_WINDOW = 15 * 60 * 1000

// Content types được phép
export const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
]

// Các endpoint nhạy cảm cần giám sát đặc biệt
export const SENSITIVE_ENDPOINTS = [
  '/login',
  '/register',
  '/refresh-token',
  '/change-password',
  '/reset-password',
]

export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS,
  LOGIN_LOCKOUT_TIME,
  MAX_REQUEST_SIZE,
  BCRYPT_SALT_ROUNDS,
  LOGIN_RATE_LIMIT_WINDOW,
  ALLOWED_CONTENT_TYPES,
  SENSITIVE_ENDPOINTS,
}

