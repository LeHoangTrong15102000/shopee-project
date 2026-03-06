import { ORDER_STATUS_CONFIG, OrderStatus, getStatusLabel } from 'src/config/orderStatus'
import { ANIMATION_DURATION, STAGGER_DELAY } from 'src/styles/animations/motion.config'

// Page-level stagger container
export const pageContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: STAGGER_DELAY.slow, delayChildren: 0.1 }
  }
}

// Section stagger item with fadeInUp
export const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATION.normal, ease: [0.25, 0.46, 0.45, 0.94] } }
}

// Order items container with faster stagger
export const itemsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: STAGGER_DELAY.normal, delayChildren: 0.05 }
  }
}

// Individual order item
export const orderItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATION.normal, ease: [0.25, 0.46, 0.45, 0.94] } }
}

// Status badge animation with scale-in
export const statusBadgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: ANIMATION_DURATION.normal, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

// Modal variants with improved entrance
export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: ANIMATION_DURATION.fast } },
  exit: { opacity: 0, transition: { duration: ANIMATION_DURATION.fast } }
}

export const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: ANIMATION_DURATION.normal, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: ANIMATION_DURATION.fast }
  }
}

// Reduced motion variants
export const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.1 } }
}

export function getStatusDisplay(status: OrderStatus) {
  const config = ORDER_STATUS_CONFIG[status]
  if (!config) {
    return {
      label: status,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      icon: status
    }
  }
  return {
    label: getStatusLabel(status),
    color: `${config.color.light} dark:${config.color.dark}`,
    bgColor: `${config.bgColor.light} dark:${config.bgColor.dark}`,
    icon: config.icon
  }
}

export const paymentMethodLabels: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  e_wallet: 'Ví điện tử',
  credit_card: 'Thẻ tín dụng/Ghi nợ'
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
