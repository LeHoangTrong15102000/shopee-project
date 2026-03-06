import crypto from 'crypto'
import { BCRYPT_SALT_ROUNDS } from '@constants/security.config'

/**
 * Tạo salt ngẫu nhiên cho việc hash password
 * Sử dụng crypto.randomBytes để tạo salt an toàn
 */
const generateSalt = (rounds: number): string => {
  const saltLength = Math.ceil(rounds * 1.5)
  return crypto.randomBytes(saltLength).toString('hex').slice(0, 22)
}

/**
 * Hash password sử dụng PBKDF2 với salt
 * Mô phỏng bcrypt với salt rounds = 12
 * PBKDF2 là thuật toán được khuyến nghị bởi NIST
 */
export const hashValue = (value: string): string => {
  const salt = generateSalt(BCRYPT_SALT_ROUNDS)
  const iterations = Math.pow(2, BCRYPT_SALT_ROUNDS)
  const hash = crypto
    .pbkdf2Sync(value, salt, iterations, 64, 'sha512')
    .toString('hex')
  // Format: $rounds$salt$hash (tương tự bcrypt format)
  return `$${BCRYPT_SALT_ROUNDS}$${salt}$${hash}`
}

/**
 * So sánh password với hash đã lưu
 * Sử dụng timing-safe comparison để chống timing attacks
 */
export const compareValue = (plainText: string, storedHash: string): boolean => {
  try {
    // Parse hash format: $rounds$salt$hash
    const parts = storedHash.split('$')
    if (parts.length !== 4) {
      // Fallback cho hash cũ (SHA-256 đơn giản)
      const oldHash = crypto.createHash('sha256').update(plainText).digest('hex')
      return oldHash === storedHash
    }

    const rounds = parseInt(parts[1], 10)
    const salt = parts[2]
    const originalHash = parts[3]

    const iterations = Math.pow(2, rounds)
    const newHash = crypto
      .pbkdf2Sync(plainText, salt, iterations, 64, 'sha512')
      .toString('hex')

    // Sử dụng timingSafeEqual để chống timing attacks
    const originalBuffer = Buffer.from(originalHash, 'hex')
    const newBuffer = Buffer.from(newHash, 'hex')

    if (originalBuffer.length !== newBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(originalBuffer, newBuffer)
  } catch {
    return false
  }
}

/**
 * Hash token với SHA-256 trước khi lưu vào database
 * Dùng cho refresh token, reset password token, etc.
 * Giúp bảo vệ token ngay cả khi database bị leak
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Tạo token ngẫu nhiên an toàn
 * Dùng cho refresh token, reset password token, etc.
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex')
}