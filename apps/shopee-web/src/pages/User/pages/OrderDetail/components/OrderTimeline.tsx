import { motion } from 'framer-motion'
import OrderTrackingTimeline from 'src/components/OrderTrackingTimeline'
import { OrderTracking } from 'src/types/orderTracking.type'
import { reducedMotionVariants, sectionVariants } from '../orderDetail.constants'

interface OrderTimelineProps {
  tracking: OrderTracking | null | undefined
  currentStatus: string | null
  orderStatus: string
  shouldReduceMotion: boolean | null
}

export default function OrderTimeline({
  tracking,
  shouldReduceMotion,
}: OrderTimelineProps) {
  const sectionItemVariants = shouldReduceMotion ? reducedMotionVariants : sectionVariants

  if (!tracking) return null

  return (
    <motion.div
      variants={sectionItemVariants}
      className="overflow-hidden rounded-xl bg-white shadow-xs transition-all duration-200 hover:shadow-md dark:border dark:border-slate-700 dark:bg-slate-800"
    >
      <OrderTrackingTimeline tracking={tracking} />
    </motion.div>
  )
}
