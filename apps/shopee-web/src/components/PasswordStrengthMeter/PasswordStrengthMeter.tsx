import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'src/hooks/useReducedMotion'

interface PasswordStrengthMeterProps {
  password: string
  className?: string
}

interface StrengthLevel {
  labelKey: string
  percent: number
  barColor: string
  textColor: string
}

const strengthLevels: StrengthLevel[] = [
  { labelKey: '', percent: 0, barColor: '#d1d5db', textColor: 'text-gray-400 dark:text-gray-500' },
  { labelKey: 'passwordStrength.weak', percent: 25, barColor: '#ef4444', textColor: 'text-red-500 dark:text-red-400' },
  {
    labelKey: 'passwordStrength.fair',
    percent: 50,
    barColor: '#f97316',
    textColor: 'text-orange-500 dark:text-orange-400'
  },
  {
    labelKey: 'passwordStrength.good',
    percent: 75,
    barColor: '#eab308',
    textColor: 'text-yellow-500 dark:text-yellow-400'
  },
  {
    labelKey: 'passwordStrength.strong',
    percent: 100,
    barColor: '#22c55e',
    textColor: 'text-green-500 dark:text-green-400'
  }
]

const calculateStrength = (password: string): number => {
  if (!password) return 0

  // Exactly 5 requirements matching the UI checklist
  let met = 0
  if (password.length >= 6) met++ // 1. Ít nhất 6 ký tự
  if (/[A-Z]/.test(password)) met++ // 2. Chứa ít nhất 1 chữ hoa
  if (/[a-z]/.test(password)) met++ // 3. Chứa ít nhất 1 chữ thường
  if (/\d/.test(password)) met++ // 4. Chứa ít nhất 1 số
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) met++ // 5. Chứa ký tự đặc biệt

  // Map: 0→0, 1→1(Yếu), 2→2(Trung bình), 3-4→3(Khá), 5→4(Mạnh)
  if (met === 5) return 4
  if (met >= 3) return 3
  if (met === 2) return 2
  if (met === 1) return 1
  return 0
}

const PasswordStrengthMeter = ({ password, className = '' }: PasswordStrengthMeterProps) => {
  const { t } = useTranslation('auth')
  const reducedMotion = useReducedMotion()

  const strength = useMemo(() => calculateStrength(password), [password])

  // Don't show if no password
  if (!password || password.length === 0) {
    return null
  }

  const currentLevel = strengthLevels[strength]
  const labelKey = currentLevel.labelKey as
    | 'passwordStrength.weak'
    | 'passwordStrength.fair'
    | 'passwordStrength.good'
    | 'passwordStrength.strong'
    | ''
  const label = labelKey ? t(labelKey) : ''

  return (
    <div
      className={className}
      role='meter'
      aria-label={t('passwordStrength.aria')}
      aria-valuenow={strength}
      aria-valuemin={0}
      aria-valuemax={4}
    >
      {/* Single continuous progress bar */}
      <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-600' aria-hidden='true'>
        {reducedMotion ? (
          <div
            className='h-full rounded-full'
            style={{
              width: `${currentLevel.percent}%`,
              backgroundColor: currentLevel.barColor,
              transition: 'width 0.3s ease, background-color 0.3s ease'
            }}
          />
        ) : (
          <motion.div
            className='h-full rounded-full'
            initial={{ width: 0 }}
            animate={{
              width: `${currentLevel.percent}%`,
              backgroundColor: currentLevel.barColor
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}
      </div>

      {/* Strength label */}
      {label && (
        <div className={`mt-1.5 flex items-center justify-end gap-1 text-xs ${currentLevel.textColor}`}>
          <span className={strength >= 4 ? 'font-semibold' : 'font-medium'}>{label}</span>
          {strength >= 4 &&
            (reducedMotion ? (
              <svg
                className='h-3.5 w-3.5 text-green-500 dark:text-green-400'
                viewBox='0 0 24 24'
                fill='currentColor'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  d='M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z'
                  clipRule='evenodd'
                />
              </svg>
            ) : (
              <motion.svg
                className='h-3.5 w-3.5 text-green-500 dark:text-green-400'
                viewBox='0 0 24 24'
                fill='currentColor'
                aria-hidden='true'
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <path
                  fillRule='evenodd'
                  d='M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z'
                  clipRule='evenodd'
                />
              </motion.svg>
            ))}
        </div>
      )}
    </div>
  )
}

export default PasswordStrengthMeter
