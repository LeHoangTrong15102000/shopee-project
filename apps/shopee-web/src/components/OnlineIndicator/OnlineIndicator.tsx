import classNames from 'classnames'

interface OnlineIndicatorProps {
  isOnline: boolean
  lastSeen?: string | null
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const formatLastSeen = (lastSeen: string | null | undefined): string => {
  if (!lastSeen) return 'Offline'
  const date = new Date(lastSeen)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'Online vừa xong'
  if (diffMinutes < 60) return `Online ${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Online ${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  return `Online ${diffDays} ngày trước`
}

export default function OnlineIndicator({
  isOnline,
  lastSeen,
  size = 'md',
  showText = true,
  className
}: OnlineIndicatorProps) {
  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={classNames('flex items-center gap-1.5', className)}>
      <span
        className={classNames('inline-block rounded-full', dotSizes[size], isOnline ? 'bg-green-500' : 'bg-gray-400')}
      />
      {showText && (
        <span className={classNames(textSizes[size], isOnline ? 'text-green-600' : 'text-gray-500')}>
          {isOnline ? 'Online' : formatLastSeen(lastSeen)}
        </span>
      )}
    </div>
  )
}
