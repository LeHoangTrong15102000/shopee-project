interface Props {
  count: number
  className?: string
}

const NotificationBadge = ({ count, className = '' }: Props) => {
  if (count <= 0) return null

  return (
    <span
      className={`absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-orange px-1 text-xs font-medium text-white dark:border-slate-800 ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default NotificationBadge
