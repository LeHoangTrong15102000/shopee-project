import { memo } from 'react'
import { motion } from 'framer-motion'

const VerificationPendingView = memo(function VerificationPendingView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='flex flex-col items-center space-y-4 py-8'
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className='flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'
      >
        <svg className='h-8 w-8 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      </motion.div>
      <div className='text-center'>
        <h4 className='text-lg font-medium text-gray-900 dark:text-gray-100'>Đang xác minh thanh toán</h4>
        <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
          Chúng tôi đang kiểm tra giao dịch của bạn. Quá trình này có thể mất vài phút.
        </p>
      </div>
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className='flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-600'
      >
        <span className='h-2 w-2 rounded-full bg-blue-500' />
        <span>Đang xử lý...</span>
      </motion.div>
    </motion.div>
  )
})

export default VerificationPendingView
