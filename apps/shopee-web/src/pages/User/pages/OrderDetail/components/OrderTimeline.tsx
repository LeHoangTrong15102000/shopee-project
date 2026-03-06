import { motion } from 'framer-motion'
import OrderStatusTracker from 'src/components/OrderStatusTracker'
import OrderTrackingTimeline from 'src/components/OrderTrackingTimeline'
import { reducedMotionVariants, sectionVariants } from '../orderDetail.constants'

interface OrderTimelineProps {
  tracking: any
  currentStatus: string | null
  isSubscribed: boolean
  orderStatus: string
  orderTotal: number
  stepTimestamps: Record<string, string>
  shouldReduceMotion: boolean | null
}

export default function OrderTimeline({
  tracking,
  currentStatus,
  isSubscribed,
  orderStatus,
  orderTotal,
  stepTimestamps,
  shouldReduceMotion
}: OrderTimelineProps) {
  const sectionItemVariants = shouldReduceMotion ? reducedMotionVariants : sectionVariants

  return (
    <>
      {tracking && (
        <motion.div
          variants={sectionItemVariants}
          className='overflow-hidden rounded-xl bg-white shadow-xs transition-all duration-200 hover:shadow-md dark:border dark:border-slate-700 dark:bg-slate-800'
        >
          <OrderTrackingTimeline tracking={tracking} />
        </motion.div>
      )}

      <motion.div variants={sectionItemVariants}>
        <OrderStatusTracker
          currentStatus={currentStatus || orderStatus}
          isSubscribed={isSubscribed}
          orderTotal={orderTotal}
          stepTimestamps={stepTimestamps}
          className='mt-4'
        />
      </motion.div>
    </>
  )
}
