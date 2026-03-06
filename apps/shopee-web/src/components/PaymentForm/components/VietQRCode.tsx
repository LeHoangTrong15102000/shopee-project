import { memo } from 'react'
import { motion } from 'framer-motion'
import BankLogo, { BankInfo } from './BankLogo'
import { formatCurrency } from './WalletCard'

const VietQRCode = memo(function VietQRCode({
  bank,
  amount,
  transferContent: _transferContent
}: {
  bank: BankInfo
  amount: number
  transferContent: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className='flex flex-col items-center'
    >
      <div className='relative rounded-2xl border-4 border-blue-500 bg-white p-4 shadow-lg'>
        <svg viewBox='0 0 200 200' className='h-48 w-48'>
          <rect fill='white' width='200' height='200' />
          <g fill='#1a1a1a'>
            <rect x='10' y='10' width='40' height='40' />
            <rect x='15' y='15' width='30' height='30' fill='white' />
            <rect x='20' y='20' width='20' height='20' />
            <rect x='150' y='10' width='40' height='40' />
            <rect x='155' y='15' width='30' height='30' fill='white' />
            <rect x='160' y='20' width='20' height='20' />
            <rect x='10' y='150' width='40' height='40' />
            <rect x='15' y='155' width='30' height='30' fill='white' />
            <rect x='20' y='160' width='20' height='20' />
            {Array.from({ length: 12 }, (_, i) =>
              Array.from({ length: 12 }, (_, j) => {
                const x = 58 + j * 7
                const y = 58 + i * 7
                const show = ((i + j) % 2 === 0 || (i * j) % 3 === 0) && Math.random() > 0.25
                return show ? <rect key={`${i}-${j}`} x={x} y={y} width='6' height='6' /> : null
              })
            )}
          </g>
        </svg>
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='rounded-lg bg-white p-1 shadow-xs'>
            <BankLogo bank={bank} size='sm' />
          </div>
        </div>
      </div>
      <div className='mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
        <svg className='h-5 w-5 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'
          />
        </svg>
        <span>Quét mã VietQR để thanh toán</span>
      </div>
      <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>Mã QR đã bao gồm số tiền {formatCurrency(amount)}</p>
    </motion.div>
  )
})

export default VietQRCode
