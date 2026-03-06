import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FlashSaleProduct {
  product_id: string
  current_stock: number
  sold: number
}

interface Props {
  endTime?: Date
  className?: string
  serverRemainingSeconds?: number
  isServerSynced?: boolean
  products?: FlashSaleProduct[]
  isEnded?: boolean
}

const FlipDigit = ({ value }: { value: string }) => (
  <AnimatePresence mode='popLayout'>
    <motion.span
      key={value}
      className='inline-block min-w-6 rounded-sm bg-white px-1 text-center text-sm font-bold text-orange dark:bg-slate-800 dark:text-orange-400'
      initial={{ opacity: 0.6, scale: 0.8, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0.6, scale: 0.8, y: 4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {value}
    </motion.span>
  </AnimatePresence>
)

const FlashSaleTimer = ({
  endTime,
  className = '',
  serverRemainingSeconds,
  isServerSynced = false,
  products,
  isEnded = false
}: Props) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    if (isEnded) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      return
    }

    if (isServerSynced && serverRemainingSeconds !== undefined) {
      const calculateFromServer = () => {
        if (serverRemainingSeconds <= 0) {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
          return
        }

        setTimeLeft({
          hours: Math.floor(serverRemainingSeconds / 3600),
          minutes: Math.floor((serverRemainingSeconds % 3600) / 60),
          seconds: Math.floor(serverRemainingSeconds % 60)
        })
      }

      calculateFromServer()
      return
    }

    if (!endTime) {
      setTimeLeft({ hours: 2, minutes: 15, seconds: 30 })
      return
    }

    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime()

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endTime, serverRemainingSeconds, isServerSynced, isEnded])

  const formatNumber = (num: number) => num.toString().padStart(2, '0')

  const totalSold = products?.reduce((sum, p) => sum + p.sold, 0) ?? 0
  const totalStock = products?.reduce((sum, p) => sum + p.current_stock, 0) ?? 0

  if (isEnded) {
    return (
      <div
        className={`flex items-center space-x-2 rounded-sm bg-gray-500 px-3 py-1 text-white dark:bg-gray-600 ${className}`}
      >
        <span className='text-sm font-medium'>Đã kết thúc</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 rounded-sm bg-orange px-3 py-1 text-white ${className}`}>
      {isServerSynced && (
        <span className='mr-1 rounded-sm bg-yellow-400 px-1 py-0.5 text-xs font-bold text-yellow-900'>⚡ Live</span>
      )}
      <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
        <path
          fillRule='evenodd'
          d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
          clipRule='evenodd'
        />
      </svg>
      <span className='text-sm font-medium'>Kết thúc trong</span>
      <div className='flex items-center space-x-1'>
        <FlipDigit value={formatNumber(timeLeft.hours)} />
        <span className='text-sm'>:</span>
        <FlipDigit value={formatNumber(timeLeft.minutes)} />
        <span className='text-sm'>:</span>
        <FlipDigit value={formatNumber(timeLeft.seconds)} />
      </div>
      {isServerSynced && products && products.length > 0 && (
        <span className='ml-2 text-xs opacity-90'>
          Đã bán: {totalSold} | Còn: {totalStock}
        </span>
      )}
    </div>
  )
}

export default FlashSaleTimer
