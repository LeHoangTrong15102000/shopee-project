import crypto from 'crypto'
import { config } from '@constants/config'
import { hashValue, compareValue } from '@utils/crypt'

/**
 * Encrypt a TOTP secret using AES-256-GCM.
 * Format: iv:authTag:ciphertext (all hex-encoded)
 */
export const encryptSecret = (secret: string): string => {
  const key = Buffer.from(config.TWO_FACTOR_ENCRYPTION_KEY, 'hex')
  const iv = crypto.randomBytes(12) // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypt a TOTP secret encrypted with encryptSecret().
 * Throws a clear error if decryption fails (e.g., key rotation).
 */
export const decryptSecret = (encrypted: string): string => {
  try {
    const parts = encrypted.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted secret format')
    }

    const [ivHex, authTagHex, ciphertextHex] = parts
    const key = Buffer.from(config.TWO_FACTOR_ENCRYPTION_KEY, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const ciphertext = Buffer.from(ciphertextHex, 'hex')

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    throw new Error('2FA secret decryption failed — user may need to re-enroll 2FA')
  }
}

/**
 * Generate 10 random 8-character alphanumeric backup codes.
 */
export const generateBackupCodes = (): string[] => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const codes: string[] = []

  for (let i = 0; i < 10; i++) {
    let code = ''
    const bytes = crypto.randomBytes(8)
    for (let j = 0; j < 8; j++) {
      code += chars[bytes[j] % chars.length]
    }
    codes.push(code)
  }

  return codes
}

/**
 * Hash an array of backup codes using PBKDF2-SHA512 (same as password hashing).
 */
export const hashBackupCodes = (codes: string[]): string[] => {
  return codes.map((code) => hashValue(code))
}

/**
 * Verify a backup code against an array of hashes.
 * Returns the index of the matched hash so the caller can remove it (single-use).
 */
export const verifyBackupCode = (
  code: string,
  hashes: string[],
): { matched: boolean; index: number } => {
  for (let i = 0; i < hashes.length; i++) {
    if (compareValue(code, hashes[i])) {
      return { matched: true, index: i }
    }
  }
  return { matched: false, index: -1 }
}
