import { AppColors } from '@/config/colors'
import { DimensionValue } from 'react-native'

export interface PasswordStrength {
  level: 'weak' | 'medium' | 'strong'
  width: DimensionValue
  color: string
  percent: number
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 6) {
    return { level: 'weak', width: '33%', color: AppColors.error, percent: 33 }
  }
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const score = [hasUpper, hasLower, hasNumber, hasSpecial, password.length >= 8].filter(
    Boolean
  ).length
  if (score >= 4) return { level: 'strong', width: '100%', color: AppColors.success, percent: 100 }
  if (score >= 2) return { level: 'medium', width: '66%', color: AppColors.warning, percent: 66 }
  return { level: 'weak', width: '33%', color: AppColors.error, percent: 33 }
}
