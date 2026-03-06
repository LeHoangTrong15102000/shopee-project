import classNames from 'classnames'

interface LatestReview {
  name: string
  rating: number
}

interface LiveReviewFeedProps {
  newReviewCount: number
  latestReview?: LatestReview
  onViewReviews?: () => void
  className?: string
}

const renderStars = (rating: number) => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

export default function LiveReviewFeed({
  newReviewCount,
  latestReview,
  onViewReviews,
  className
}: LiveReviewFeedProps) {
  if (newReviewCount <= 0) {
    return null
  }

  return (
    <div
      className={classNames(
        'flex animate-fade-in cursor-pointer items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm transition-colors hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:hover:bg-orange-900/30',
        className
      )}
      onClick={onViewReviews}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onViewReviews?.()}
    >
      <span className='text-lg'>⭐</span>
      <div className='min-w-0 flex-1'>
        {latestReview && (
          <p className='truncate text-gray-700 dark:text-gray-200'>
            <span className='text-yellow-500'>{renderStars(latestReview.rating)}</span>{' '}
            <span className='font-medium'>{latestReview.name}</span> vừa đánh giá {latestReview.rating} sao
          </p>
        )}
        <p className='font-medium text-[#ee4d2d]'>{newReviewCount} đánh giá mới</p>
      </div>
      <span className='ml-auto shrink-0 text-xs text-gray-400 dark:text-gray-500'>Nhấn để xem ↓</span>
    </div>
  )
}
