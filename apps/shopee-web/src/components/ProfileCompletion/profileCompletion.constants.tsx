import { motion } from 'framer-motion'
import { User } from 'src/types/user.type'

// Shimmer effect component for incomplete fields
export const ShimmerEffect = () => (
  <motion.div
    className='absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent'
    animate={{ translateX: ['100%', '-100%'] }}
    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
    aria-hidden='true'
  />
)

// Floating particles for visual interest
export interface FloatingParticleProps {
  delay: number
  size: number
  color: string
}

export const FloatingParticle = ({ delay, size, color }: FloatingParticleProps) => (
  <motion.div
    className={`absolute rounded-full ${color}`}
    style={{ width: size, height: size }}
    initial={{ opacity: 0, y: 0 }}
    animate={{
      opacity: [0, 0.6, 0],
      y: [-5, -15, -25],
      x: [0, Math.random() * 10 - 5, Math.random() * 20 - 10]
    }}
    transition={{
      duration: 2.5,
      repeat: Infinity,
      repeatDelay: 1.5,
      delay,
      ease: 'easeOut'
    }}
    aria-hidden='true'
  />
)

// Golden shimmer sparkle component for 100% completion
export interface GoldenSparkleProps {
  delay: number
  x: number
  y: number
  size?: number
}

export const GoldenSparkle = ({ delay, x, y, size = 6 }: GoldenSparkleProps) => (
  <motion.div
    className='absolute rounded-full bg-linear-to-r from-yellow-300 to-amber-400'
    style={{ left: x, top: y, width: size, height: size }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0.5, 1.2, 0.5]
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 2,
      delay,
      ease: 'easeInOut'
    }}
    aria-hidden='true'
  />
)

// SVG Icons for profile fields
export const ProfileIcons = {
  name: (className: string) => (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      aria-hidden='true'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
      />
    </svg>
  ),
  avatar: (className: string) => (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      aria-hidden='true'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z'
      />
    </svg>
  ),
  phone: (className: string) => (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      aria-hidden='true'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3'
      />
    </svg>
  ),
  address: (className: string) => (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      aria-hidden='true'
    >
      <path strokeLinecap='round' strokeLinejoin='round' d='M15 10.5a3 3 0 11-6 0 3 3 0 016 0z' />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'
      />
    </svg>
  ),
  date_of_birth: (className: string) => (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      aria-hidden='true'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5'
      />
    </svg>
  )
}

export const PROFILE_FIELDS = [
  { key: 'name', weight: 20 },
  { key: 'avatar', weight: 20 },
  { key: 'phone', weight: 20 },
  { key: 'address', weight: 20 },
  { key: 'date_of_birth', weight: 20 }
] as const

export type ProfileFieldKey = (typeof PROFILE_FIELDS)[number]['key']

export const isFieldComplete = (user: User | null, key: ProfileFieldKey): boolean => {
  if (!user) return false
  const value = user[key]
  if (value === undefined || value === null || value === '') return false
  if (key === 'date_of_birth') {
    const date = new Date(value)
    return !isNaN(date.getTime())
  }
  return true
}
