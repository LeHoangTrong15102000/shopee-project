import { memo } from 'react'
import { motion } from 'framer-motion'
import Button from 'src/components/Button'
import { WalletInfo, WalletLogo, formatCurrency } from './WalletCard'
import { EWalletCountdownTimer } from '../shared/CountdownTimer'

const QRCodePlaceholder = memo(function QRCodePlaceholder({ walletName }: { walletName: string }) {
  return (
    <div className='relative'>
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
          {Array.from({ length: 15 }, (_, i) =>
            Array.from({ length: 15 }, (_, j) => {
              const x = 55 + j * 6
              const y = 55 + i * 6
              const show = (i + j) % 3 !== 0 && Math.random() > 0.3
              return show ? <rect key={`${i}-${j}`} x={x} y={y} width='5' height='5' /> : null
            })
          )}
        </g>
      </svg>
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='rounded-lg bg-white p-1 shadow-xs dark:bg-slate-700'>
          <span className='text-xs font-bold text-gray-800 dark:text-gray-200'>{walletName}</span>
        </div>
      </div>
    </div>
  )
})

const QRDisplayView = memo(function QRDisplayView({
  wallet,
  amount,
  timeRemaining,
  isMobile,
  onOpenApp,
  onCancel
}: {
  wallet: WalletInfo
  amount: number
  timeRemaining: number
  isMobile: boolean
  onOpenApp: () => void
  onCancel: () => void
}) {
  const isExpired = timeRemaining <= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='flex flex-col items-center space-y-6'
    >
      <div className='text-center'>
        <h4 className='text-lg font-medium text-gray-900 dark:text-gray-100'>Quét mã QR để thanh toán</h4>
        <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
          Mở ứng dụng <span className={`font-semibold ${wallet.color}`}>{wallet.name}</span> và quét mã bên dưới
        </p>
      </div>

      <div className={`rounded-2xl border-4 ${wallet.borderColor} bg-white p-4 shadow-lg`}>
        <QRCodePlaceholder walletName={wallet.name} />
      </div>

      <div className='text-center'>
        <p className='text-sm text-gray-500 dark:text-gray-400'>Số tiền thanh toán</p>
        <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>{formatCurrency(amount)}</p>
      </div>

      <EWalletCountdownTimer seconds={timeRemaining} isExpired={isExpired} />

      <div className='w-full space-y-3'>
        {isMobile && (
          <Button
            type='button'
            onClick={onOpenApp}
            disabled={isExpired}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-white ${
              isExpired
                ? 'cursor-not-allowed bg-gray-400'
                : `bg-linear-to-r ${
                    wallet.id === 'momo'
                      ? 'from-pink-500 to-pink-600'
                      : wallet.id === 'zalopay'
                        ? 'from-blue-500 to-blue-600'
                        : 'from-red-500 to-blue-600'
                  } hover:opacity-90`
            }`}
          >
            <WalletLogo wallet={wallet.id} />
            <span>Mở ứng dụng {wallet.name}</span>
          </Button>
        )}

        <Button
          type='button'
          onClick={onCancel}
          className='w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
        >
          Hủy thanh toán
        </Button>
      </div>

      <p className='text-center text-xs text-gray-400 dark:text-gray-500'>
        {isMobile
          ? `Nhấn nút "Mở ứng dụng ${wallet.name}" hoặc quét mã QR bằng ứng dụng ${wallet.name}`
          : `Quét mã QR bằng ứng dụng ${wallet.name} trên điện thoại của bạn`}
      </p>
    </motion.div>
  )
})

export default QRDisplayView
