import crypto from 'crypto'

/**
 * Tạo token ngẫu nhiên an toàn sử dụng crypto.randomBytes
 * Dùng cho refresh token, reset password token, verification token, etc.
 * @param length - Độ dài của token (mặc định 32 bytes = 64 ký tự hex)
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Mask email để bảo vệ thông tin cá nhân khi logging
 * Ví dụ: example@gmail.com -> e*****e@gmail.com
 * @param email - Email cần mask
 */
export const maskEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return '***'
  }

  const [localPart, domain] = email.split('@')

  if (!localPart || !domain) {
    return '***'
  }

  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`
  }

  const firstChar = localPart[0]
  const lastChar = localPart[localPart.length - 1]
  const maskedLength = Math.min(localPart.length - 2, 5)

  return `${firstChar}${'*'.repeat(maskedLength)}${lastChar}@${domain}`
}

/**
 * Mask IP address để bảo vệ thông tin khi logging
 * IPv4: 192.168.1.100 -> 192.168.xxx.xxx
 * IPv6: 2001:0db8:85a3::8a2e:0370:7334 -> 2001:0db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx
 * @param ip - IP address cần mask
 */
export const maskIP = (ip: string): string => {
  if (!ip || typeof ip !== 'string') {
    return 'xxx.xxx.xxx.xxx'
  }

  // Xử lý IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`
    }
  }

  // Xử lý IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx`
    }
  }

  return 'xxx.xxx.xxx.xxx'
}

/**
 * Kiểm tra độ mạnh của password
 * Yêu cầu:
 * - Tối thiểu 8 ký tự
 * - Có ít nhất 1 chữ hoa
 * - Có ít nhất 1 chữ thường
 * - Có ít nhất 1 số
 * - Có ít nhất 1 ký tự đặc biệt
 * @param password - Password cần kiểm tra
 * @returns Object chứa kết quả validation và thông báo lỗi
 */
export const isValidPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password không được để trống'] }
  }

  // Kiểm tra độ dài tối thiểu
  if (password.length < 8) {
    errors.push('Password phải có ít nhất 8 ký tự')
  }

  // Kiểm tra độ dài tối đa
  if (password.length > 128) {
    errors.push('Password không được vượt quá 128 ký tự')
  }

  // Kiểm tra chữ hoa
  if (!/[A-Z]/.test(password)) {
    errors.push('Password phải có ít nhất 1 chữ hoa')
  }

  // Kiểm tra chữ thường
  if (!/[a-z]/.test(password)) {
    errors.push('Password phải có ít nhất 1 chữ thường')
  }

  // Kiểm tra số
  if (!/[0-9]/.test(password)) {
    errors.push('Password phải có ít nhất 1 số')
  }

  // Kiểm tra ký tự đặc biệt
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password phải có ít nhất 1 ký tự đặc biệt')
  }

  // Kiểm tra không chứa khoảng trắng
  if (/\s/.test(password)) {
    errors.push('Password không được chứa khoảng trắng')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Kiểm tra password đơn giản (chỉ yêu cầu độ dài tối thiểu)
 * Dùng cho backward compatibility với code cũ
 * @param password - Password cần kiểm tra
 * @param minLength - Độ dài tối thiểu (mặc định 6)
 */
export const isValidPasswordSimple = (password: string, minLength: number = 6): boolean => {
  if (!password || typeof password !== 'string') {
    return false
  }
  return password.length >= minLength
}

/**
 * Tạo session ID ngẫu nhiên
 * Dùng để track các phiên đăng nhập
 */
export const generateSessionId = (): string => {
  return crypto.randomUUID()
}

/**
 * Sanitize user input để tránh XSS
 * Chỉ dùng cho các trường hợp đơn giản, nên dùng thư viện chuyên dụng cho production
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
