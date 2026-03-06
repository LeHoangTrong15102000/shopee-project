import classNames from 'classnames'
import { ORDER_STATUS_CONFIG, getStatusLabel } from 'src/config/orderStatus'
import type { OrderStatus } from 'src/config/orderStatus'

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm'
}

const StatusBadge = ({ status, className, size = 'md' }: StatusBadgeProps) => {
  const config = ORDER_STATUS_CONFIG[status]
  if (!config) return null

  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full border font-semibold',
        `${config.color.light} dark:${config.color.dark}`,
        `${config.bgColor.light} dark:${config.bgColor.dark}`,
        `${config.borderColor.light} dark:${config.borderColor.dark}`,
        sizeClasses[size],
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}

export default StatusBadge
