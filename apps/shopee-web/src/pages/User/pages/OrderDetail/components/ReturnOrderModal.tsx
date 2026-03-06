import { motion } from 'framer-motion'
import Button from 'src/components/Button'
import { ANIMATION_DURATION } from 'src/styles/animations/motion.config'
import { modalBackdropVariants, modalContentVariants, reducedMotionVariants } from '../orderDetail.constants'

interface ReturnOrderModalProps {
  returnReason: string
  setReturnReason: (reason: string) => void
  returnReasonError: string
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
  shouldReduceMotion: boolean | null
}

export default function ReturnOrderModal({
  returnReason,
  setReturnReason,
  returnReasonError,
  onClose,
  onConfirm,
  isPending,
  shouldReduceMotion
}: ReturnOrderModalProps) {
  return (
    <motion.div
      variants={shouldReduceMotion ? reducedMotionVariants : modalBackdropVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-xs'
      onClick={onClose}
    >
      <motion.div
        variants={shouldReduceMotion ? reducedMotionVariants : modalContentVariants}
        initial='hidden'
        animate='visible'
        exit='exit'
        onClick={(e) => e.stopPropagation()}
        className='relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-700 dark:bg-slate-800'
      >
        <button
          onClick={onClose}
          className='absolute top-4 right-4 cursor-pointer rounded-full p-1 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-gray-300'
          aria-label='Đóng modal'
        >
          <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
        <div className='mb-4'>
          <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>Trả hàng/Hoàn tiền</h3>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            Vui lòng cho chúng tôi biết lý do bạn muốn trả hàng
          </p>
        </div>
        <textarea
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value)}
          placeholder='Nhập lý do trả hàng (bắt buộc)'
          className={`w-full resize-none rounded-xl border p-3 text-sm transition-all duration-200 focus:ring-2 focus:outline-hidden dark:bg-slate-900 dark:text-gray-100 dark:placeholder-gray-500 ${
            returnReasonError
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200/20 dark:border-red-600 dark:focus:border-red-500'
              : 'border-gray-200 focus:border-orange focus:ring-orange/20 dark:border-slate-600 dark:focus:border-orange-400'
          }`}
          rows={3}
        />
        {returnReasonError && <p className='mt-1.5 text-xs text-red-500 dark:text-red-400'>{returnReasonError}</p>}
        <div className='mt-5 flex justify-end gap-3'>
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ duration: ANIMATION_DURATION.fast }}
          >
            <Button
              onClick={onClose}
              className='cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:border-slate-500 dark:hover:bg-slate-700'
            >
              Đóng
            </Button>
          </motion.div>
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ duration: ANIMATION_DURATION.fast }}
          >
            <Button
              onClick={onConfirm}
              disabled={isPending}
              className='cursor-pointer rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:from-amber-600 hover:to-orange-700 hover:shadow-lg hover:shadow-amber-200/50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:shadow-amber-900/30'
            >
              {isPending ? 'Đang xử lý...' : 'Xác nhận trả hàng'}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
