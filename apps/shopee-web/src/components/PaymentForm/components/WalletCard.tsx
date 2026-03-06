import { memo } from 'react'
import { motion } from 'framer-motion'
import Button from 'src/components/Button'

export type WalletType = 'momo' | 'zalopay' | 'vnpay'

export interface WalletInfo {
  id: WalletType
  name: string
  color: string
  bgColor: string
  borderColor: string
  balance: number
  isLinked: boolean
  deepLink: string
}

export const WALLETS: WalletInfo[] = [
  {
    id: 'momo',
    name: 'MoMo',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-500',
    balance: 2500000,
    isLinked: true,
    deepLink: 'momo://payment'
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    balance: 1800000,
    isLinked: true,
    deepLink: 'zalopay://payment'
  },
  {
    id: 'vnpay',
    name: 'VNPay',
    color: 'text-red-600',
    bgColor: 'bg-linear-to-r from-red-50 to-blue-50',
    borderColor: 'border-red-500',
    balance: 3200000,
    isLinked: false,
    deepLink: 'vnpay://payment'
  }
]

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export const WalletLogo = memo(function WalletLogo({ wallet }: { wallet: WalletType }) {
  const logoConfig: Record<WalletType, { gradient: string; text: string }> = {
    momo: { gradient: 'from-pink-500 to-pink-600', text: 'M' },
    zalopay: { gradient: 'from-blue-500 to-blue-600', text: 'Z' },
    vnpay: { gradient: 'from-red-500 to-blue-600', text: 'V' }
  }
  const config = logoConfig[wallet]
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${config.gradient} shadow-lg`}
    >
      <span className='text-xl font-bold text-white'>{config.text}</span>
    </div>
  )
})

const LinkedBadge = memo(function LinkedBadge({ isLinked }: { isLinked: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isLinked
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
      }`}
    >
      {isLinked ? 'Đã liên kết' : 'Chưa liên kết'}
    </span>
  )
})

const WalletCard = memo(function WalletCard({
  wallet,
  isSelected,
  onSelect
}: {
  wallet: WalletInfo
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        type='button'
        onClick={onSelect}
        animated={false}
        className={`relative w-full rounded-xl border-2 p-4 text-left transition-all ${
          isSelected
            ? `${wallet.borderColor} ${wallet.bgColor}`
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500'
        }`}
      >
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className='absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500'
          >
            <svg className='h-4 w-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
            </svg>
          </motion.div>
        )}
        <div className='flex items-center gap-3'>
          <WalletLogo wallet={wallet.id} />
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <span className={`font-semibold ${wallet.color}`}>{wallet.name}</span>
              <LinkedBadge isLinked={wallet.isLinked} />
            </div>
            <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
              Số dư: <span className='font-medium'>{formatCurrency(wallet.balance)}</span>
            </p>
          </div>
        </div>
      </Button>
    </motion.div>
  )
})

export default WalletCard
