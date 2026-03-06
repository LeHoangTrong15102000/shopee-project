import { motion } from 'framer-motion'
import Button from 'src/components/Button'
import { ANIMATION_DURATION } from 'src/styles/animations/motion.config'
import { reducedMotionVariants, sectionVariants } from '../orderDetail.constants'

interface OrderActionButtonsProps {
  canCancel: boolean
  canReturn: boolean
  isReturnExpired: boolean
  shouldReduceMotion: boolean | null
  onShowCancelModal: () => void
  onShowReturnModal: () => void
}

export default function OrderActionButtons({
  canCancel,
  canReturn,
  isReturnExpired,
  shouldReduceMotion,
  onShowCancelModal,
  onShowReturnModal
}: OrderActionButtonsProps) {
  if (!canCancel && !canReturn && !isReturnExpired) return null

  const sectionItemVariants = shouldReduceMotion ? reducedMotionVariants : sectionVariants

  return (
    <motion.div variants={sectionItemVariants} className='flex flex-col justify-end gap-3 sm:flex-row sm:items-center'>
      {isReturnExpired && <span className='text-sm text-gray-400 dark:text-gray-500'>Đã quá hạn trả hàng</span>}
      {canReturn && (
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          transition={{ duration: ANIMATION_DURATION.fast }}
        >
          <Button
            onClick={onShowReturnModal}
            aria-label='Trả hàng/Hoàn tiền'
            className='cursor-pointer rounded-xl border-2 border-amber-400/80 bg-white px-6 py-2.5 font-medium text-amber-600 transition-all duration-200 hover:border-amber-500 hover:bg-amber-50 hover:shadow-md hover:shadow-amber-100/50 dark:border-amber-500/40 dark:bg-slate-800 dark:text-amber-400 dark:hover:border-amber-400 dark:hover:bg-amber-950/20 dark:hover:shadow-amber-900/20'
          >
            Trả hàng/Hoàn tiền
          </Button>
        </motion.div>
      )}
      {canCancel && (
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          transition={{ duration: ANIMATION_DURATION.fast }}
        >
          <Button
            onClick={onShowCancelModal}
            aria-label='Hủy đơn hàng'
            className='cursor-pointer rounded-xl border-2 border-red-400/80 bg-white px-6 py-2.5 font-medium text-red-500 transition-all duration-200 hover:border-red-500 hover:bg-red-50 hover:shadow-md hover:shadow-red-100/50 dark:border-red-500/40 dark:bg-slate-800 dark:text-red-400 dark:hover:border-red-400 dark:hover:bg-red-950/20 dark:hover:shadow-red-900/20'
          >
            Hủy đơn hàng
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
