import classNames from 'classnames'
import { ORDER_STATUS_CONFIG, OrderStatus, getStatusLabel } from 'src/config/orderStatus'

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
}

export default function OrderStatusBadge({ status, className, size = 'md' }: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status]

  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full border font-medium',
        config.bgColor.light,
        `dark:${config.bgColor.dark}`,
        config.color.light,
        `dark:${config.color.dark}`,
        config.borderColor.light,
        `dark:${config.borderColor.dark}`,
        SIZE_CLASSES[size],
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}
