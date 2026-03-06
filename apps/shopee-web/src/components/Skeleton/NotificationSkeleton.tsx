import SkeletonBase from './SkeletonBase'

interface NotificationSkeletonProps {
  count?: number
}

export default function NotificationSkeleton({ count = 3 }: NotificationSkeletonProps) {
  return (
    <div role='status' aria-busy='true' aria-label='Đang tải thông báo' className='min-h-[200px]'>
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className='flex min-h-[80px] items-start border-b border-gray-100 p-4 last:border-b-0 dark:border-slate-700'
        >
          {/* Icon placeholder */}
          <div className='mr-3 shrink-0'>
            <SkeletonBase className='h-8 w-8 rounded-full' />
          </div>

          {/* Content */}
          <div className='min-w-0 flex-1'>
            {/* Title row */}
            <div className='flex items-start justify-between'>
              <SkeletonBase className='mb-2 h-4 w-32' />
              <SkeletonBase className='ml-2 h-2 w-2 shrink-0 rounded-full' />
            </div>

            {/* Message - 2 lines */}
            <SkeletonBase className='mb-1 h-3 w-full' />
            <SkeletonBase className='mb-2 h-3 w-4/5' />

            {/* Time */}
            <SkeletonBase className='h-3 w-16' />
          </div>
        </div>
      ))}
    </div>
  )
}
