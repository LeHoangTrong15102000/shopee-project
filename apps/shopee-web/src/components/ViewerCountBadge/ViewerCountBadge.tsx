import classNames from 'classnames'

interface ViewerCountBadgeProps {
  viewerCount: number
  isPopular: boolean
  className?: string
}

export default function ViewerCountBadge({ viewerCount, isPopular, className }: ViewerCountBadgeProps) {
  if (viewerCount <= 1) {
    return null
  }

  return (
    <div
      className={classNames(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
        {
          'animate-pulse bg-orange/10 text-[#ee4d2d]': isPopular,
          'bg-gray-100 text-gray-600': !isPopular
        },
        className
      )}
    >
      <span>👁</span>
      {isPopular ? (
        <span className='font-medium'>🔥 Nhiều người đang xem!</span>
      ) : (
        <span>{viewerCount} người đang xem</span>
      )}
    </div>
  )
}
