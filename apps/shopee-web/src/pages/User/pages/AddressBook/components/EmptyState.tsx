import { motion } from 'framer-motion'
import Button from 'src/components/Button'

interface EmptyStateProps {
  onAddNew: () => void
}

const EmptyState = ({ onAddNew }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-linear-to-b from-gray-50 to-white py-16 dark:border-slate-600 dark:from-slate-900 dark:to-slate-800'
    >
      {/* Animated location icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className='relative'
      >
        <div className='flex h-24 w-24 items-center justify-center rounded-full bg-orange/10 dark:bg-orange-400/20'>
          <svg
            className='h-12 w-12 text-orange dark:text-orange-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
            />
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
          </svg>
        </div>
        {/* Decorative dots */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className='absolute -top-2 -right-2 h-4 w-4 rounded-full bg-orange/30 dark:bg-orange-400/40'
        />
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
          className='absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-blue-300/50 dark:bg-blue-400/40'
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className='mt-6 text-center'
      >
        <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-100'>Chưa có địa chỉ nào</h3>
        <p className='mx-auto mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400'>
          Thêm địa chỉ giao hàng để việc mua sắm trở nên nhanh chóng và thuận tiện hơn
        </p>
      </motion.div>

      {/* Features list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className='mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-400'
      >
        <span className='flex items-center gap-1'>
          <svg className='h-4 w-4 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
          Giao hàng nhanh
        </span>
        <span className='flex items-center gap-1'>
          <svg className='h-4 w-4 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
          Lưu nhiều địa chỉ
        </span>
        <span className='flex items-center gap-1'>
          <svg className='h-4 w-4 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
          Thanh toán dễ dàng
        </span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Button
          onClick={onAddNew}
          className='mt-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange to-orange/90 px-8 text-sm font-medium text-white shadow-lg shadow-orange/30 transition-all hover:shadow-xl hover:shadow-orange/40 dark:from-orange-400 dark:to-orange-500 dark:shadow-orange-400/30 dark:hover:shadow-orange-400/40'
        >
          <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          Thêm địa chỉ đầu tiên
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default EmptyState
