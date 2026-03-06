import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { formatDistanceToNow } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import reviewApi from 'src/apis/review.api'
import { Review, ReviewComment, CreateCommentData } from 'src/types/review.type'
import ProductRating from 'src/components/ProductRating'
import { useOptimisticReviewLike } from 'src/hooks/optimistic'
import Button from 'src/components/Button'

interface ProductReviewsProps {
  productId: string
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { t } = useTranslation('product')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful'>(
    'newest'
  )
  const [ratingFilter, setRatingFilter] = useState<number | undefined>()
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<{ reviewId: string; commentId?: string } | null>(null)
  const [commentText, setCommentText] = useState('')

  const queryClient = useQueryClient()

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['product-reviews', productId, currentPage, sortBy, ratingFilter],
    queryFn: () =>
      reviewApi.getProductReviews(productId, {
        page: currentPage,
        limit: 10,
        sort: sortBy,
        rating: ratingFilter
      })
  })

  // Like/Unlike mutation với Optimistic Updates
  const likeMutation = useOptimisticReviewLike(productId)

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: reviewApi.createComment
  })

  const reviews = reviewsData?.data.data.reviews || []
  const stats = reviewsData?.data.data.stats
  const pagination = reviewsData?.data.data.pagination

  // Handle like/unlike với Optimistic Updates
  const handleLike = (reviewId: string) => {
    likeMutation.mutate(reviewId)
  }

  // Handle comment submit
  const handleCommentSubmit = (reviewId: string, parentCommentId?: string) => {
    if (!commentText.trim()) return

    const commentData: CreateCommentData = {
      review_id: reviewId,
      content: commentText.trim(),
      parent_comment_id: parentCommentId
    }

    commentMutation.mutate(commentData, {
      onSuccess: () => {
        toast.success(t('reviews.comment') + '!')
        setCommentText('')
        setReplyingTo(null)
        queryClient.invalidateQueries({ queryKey: ['review-comments', reviewId] })
      },
      onError: () => {
        toast.error('Error')
      }
    })
  }

  // Toggle comments visibility
  const toggleComments = (reviewId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedComments(newExpanded)
  }

  if (isLoading) {
    return (
      <div className='rounded-sm bg-white p-4 shadow-sm md:p-8 dark:bg-slate-800'>
        <div className='animate-pulse'>
          <div className='mb-4 h-6 w-1/3 rounded-sm bg-gray-200 dark:bg-slate-700'></div>
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='border-b pb-4 dark:border-slate-700'>
                <div className='mb-2 h-4 w-1/4 rounded-sm bg-gray-200 dark:bg-slate-700'></div>
                <div className='mb-2 h-3 w-full rounded-sm bg-gray-200 dark:bg-slate-700'></div>
                <div className='h-3 w-3/4 rounded-sm bg-gray-200 dark:bg-slate-700'></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='rounded-sm bg-white p-4 shadow-sm md:p-8 dark:bg-slate-800'>
      {/* Header */}
      <h2 className='mb-6 text-xl font-semibold text-gray-800 dark:text-gray-200'>
        {t('reviews.title').toUpperCase()}
      </h2>

      {/* Stats Overview */}
      {stats && (
        <div className='mb-6 rounded-lg bg-red-50 p-6 dark:bg-red-900/20'>
          <div className='flex items-center space-x-8'>
            {/* Average Rating */}
            <div className='text-center'>
              <div className='mb-1 text-3xl font-bold text-red-500'>{stats.average_rating}/5</div>
              <ProductRating
                rating={stats.average_rating}
                activeClassname='h-5 w-5 fill-red-500 text-red-500'
                nonActiveClassname='h-5 w-5 fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
              />
              <div className='mt-1 text-sm text-gray-600 dark:text-gray-400'>{stats.total_reviews} đánh giá</div>
            </div>

            {/* Rating Breakdown */}
            <div className='flex-1'>
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className='mb-1 flex items-center'>
                  <span className='w-8 text-sm dark:text-gray-300'>{star}</span>
                  <svg className='mx-1 h-4 w-4 fill-current text-yellow-400' viewBox='0 0 20 20'>
                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                  </svg>
                  <div className='mx-2 flex-1'>
                    <div className='h-2 rounded-full bg-gray-200 dark:bg-slate-700'>
                      <div
                        className='h-2 rounded-full bg-red-500'
                        style={{
                          width:
                            stats.total_reviews > 0
                              ? `${(stats.rating_breakdown[star as keyof typeof stats.rating_breakdown] / stats.total_reviews) * 100}%`
                              : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className='w-8 text-sm text-gray-600 dark:text-gray-400'>
                    {stats.rating_breakdown[star as keyof typeof stats.rating_breakdown]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='mb-6 flex flex-col items-start justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center dark:border-slate-700'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-medium dark:text-gray-300'></span>
          <Button
            animated={false}
            onClick={() => setRatingFilter(undefined)}
            className={`rounded-sm px-3 py-1 text-sm ${!ratingFilter ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'}`}
          >
            {t('reviews.all')}
          </Button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <Button
              animated={false}
              key={rating}
              onClick={() => setRatingFilter(rating)}
              className={`flex items-center rounded-sm px-3 py-1 text-sm ${ratingFilter === rating ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'}`}
            >
              {t('reviews.stars', { count: rating })}{' '}
              <svg className='ml-1 h-3 w-3 fill-current' viewBox='0 0 20 20'>
                <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
              </svg>
            </Button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className='rounded-sm border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100'
        >
          <option value='newest'>{t('reviews.newest')}</option>
          <option value='oldest'>{t('reviews.oldest')}</option>
          <option value='highest_rating'>{t('reviews.stars', { count: 5 })}</option>
          <option value='lowest_rating'>{t('reviews.stars', { count: 1 })}</option>
          <option value='most_helpful'>{t('reviews.mostHelpful')}</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className='space-y-6'>
        {reviews.map((review: Review) => (
          <ReviewItem
            key={review._id}
            review={review}
            onLike={handleLike}
            onToggleComments={toggleComments}
            isCommentsExpanded={expandedComments.has(review._id)}
            onReply={(commentId?: string) => setReplyingTo({ reviewId: review._id, commentId })}
            replyingTo={replyingTo}
            commentText={commentText}
            setCommentText={setCommentText}
            onCommentSubmit={handleCommentSubmit}
            isSubmittingComment={commentMutation.isPending}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className='mt-8 flex justify-center'>
          <div className='flex space-x-2'>
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
              <Button
                animated={false}
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`rounded px-3 py-2 text-sm ${
                  page === currentPage
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                {page}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Review Item Component
interface ReviewItemProps {
  review: Review
  onLike: (reviewId: string) => void
  onToggleComments: (reviewId: string) => void
  isCommentsExpanded: boolean
  onReply: (commentId?: string) => void
  replyingTo: { reviewId: string; commentId?: string } | null
  commentText: string
  setCommentText: (text: string) => void
  onCommentSubmit: (reviewId: string, parentCommentId?: string) => void
  isSubmittingComment: boolean
}

const ReviewItem = ({
  review,
  onLike,
  onToggleComments,
  isCommentsExpanded,
  onReply,
  replyingTo,
  commentText,
  setCommentText,
  onCommentSubmit,
  isSubmittingComment
}: ReviewItemProps) => {
  const { t, i18n } = useTranslation('product')
  const dateLocale = i18n.language === 'vi' ? vi : enUS
  // Fetch comments when expanded
  const { data: commentsData } = useQuery({
    queryKey: ['review-comments', review._id],
    queryFn: () => reviewApi.getReviewComments(review._id),
    enabled: isCommentsExpanded
  })

  const comments = commentsData?.data.data.comments || []

  return (
    <div className='border-b border-gray-200 pb-6 dark:border-slate-700'>
      {/* User Info */}
      <div className='flex items-start space-x-4'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 dark:bg-slate-600'>
          {review.user.avatar ? (
            <img src={review.user.avatar} alt={review.user.name} className='h-10 w-10 rounded-full object-cover' />
          ) : (
            <span className='text-sm font-medium text-gray-600 dark:text-gray-300'>
              {review.user.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className='flex-1'>
          {/* User Name & Rating */}
          <div className='mb-1 flex items-center space-x-2'>
            <span className='font-medium text-gray-800 dark:text-gray-200'>{review.user.name}</span>
            <ProductRating
              rating={review.rating}
              activeClassname='h-4 w-4 fill-yellow-400 text-yellow-400'
              nonActiveClassname='h-4 w-4 fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
            />
          </div>

          {/* Time */}
          <div className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: dateLocale })}
          </div>

          {/* Comment */}
          <div className='mb-3 text-gray-700 dark:text-gray-300'>{review.comment}</div>

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className='mb-3 flex space-x-2'>
              {review.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt='Review'
                  className='h-20 w-20 rounded-sm border object-cover dark:border-slate-600'
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className='flex items-center space-x-4 text-sm'>
            <Button
              variant='text'
              animated={false}
              onClick={() => onLike(review._id)}
              className={`flex items-center space-x-1 ${review.is_liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} hover:text-red-500`}
            >
              <svg className='h-4 w-4 fill-current' viewBox='0 0 20 20'>
                <path d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' />
              </svg>
              <span>
                {t('reviews.helpful')} ({review.helpful_count})
              </span>
            </Button>

            <Button
              variant='text'
              animated={false}
              onClick={() => onToggleComments(review._id)}
              className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            >
              {t('reviews.comment')} ({review.comments_count || comments.length})
            </Button>

            <Button
              variant='text'
              animated={false}
              onClick={() => onReply()}
              className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            >
              {t('reviews.reply')}
            </Button>
          </div>

          {/* Comments Section */}
          {isCommentsExpanded && (
            <div className='mt-4 border-l-2 border-gray-200 pl-4 dark:border-slate-600'>
              {comments.map((comment: ReviewComment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  onReply={onReply}
                  replyingTo={replyingTo}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  onCommentSubmit={onCommentSubmit}
                  isSubmittingComment={isSubmittingComment}
                />
              ))}

              {/* Reply Form */}
              {replyingTo?.reviewId === review._id && !replyingTo.commentId && (
                <div className='mt-4'>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('reviews.writeComment')}
                    className='w-full resize-none rounded-md border border-gray-300 bg-white p-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100'
                    rows={3}
                  />
                  <div className='mt-2 flex justify-end space-x-2'>
                    <Button
                      variant='ghost'
                      animated={false}
                      onClick={() => onReply()}
                      className='rounded-sm border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
                    >
                      {t('reviews.cancel')}
                    </Button>
                    <Button
                      animated={false}
                      onClick={() => onCommentSubmit(review._id)}
                      disabled={isSubmittingComment || !commentText.trim()}
                      className='rounded-sm bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {isSubmittingComment ? t('reviews.sending') : t('reviews.send')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Comment Item Component
interface CommentItemProps {
  comment: ReviewComment
  onReply: (commentId?: string) => void
  replyingTo: { reviewId: string; commentId?: string } | null
  commentText: string
  setCommentText: (text: string) => void
  onCommentSubmit: (reviewId: string, parentCommentId?: string) => void
  isSubmittingComment: boolean
}

const CommentItem = ({
  comment,
  onReply,
  replyingTo,
  commentText,
  setCommentText,
  onCommentSubmit,
  isSubmittingComment
}: CommentItemProps) => {
  const { t, i18n } = useTranslation('product')
  const dateLocale = i18n.language === 'vi' ? vi : enUS
  return (
    <div className='mb-4'>
      <div className='flex items-start space-x-3'>
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 dark:bg-slate-600'>
          {comment.user.avatar ? (
            <img src={comment.user.avatar} alt={comment.user.name} className='h-8 w-8 rounded-full object-cover' />
          ) : (
            <span className='text-xs font-medium text-gray-600 dark:text-gray-300'>
              {comment.user.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className='flex-1'>
          <div className='rounded-lg bg-gray-100 p-3 dark:bg-slate-700'>
            <div className='mb-1 text-sm font-medium text-gray-800 dark:text-gray-200'>{comment.user.name}</div>
            <div className='text-sm text-gray-700 dark:text-gray-300'>{comment.content}</div>
          </div>

          <div className='mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400'>
            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: dateLocale })}</span>
            <Button
              variant='text'
              animated={false}
              onClick={() => onReply(comment._id)}
              className='hover:text-gray-700 dark:hover:text-gray-300'
            >
              {t('reviews.reply')}
            </Button>
          </div>

          {/* Reply Form */}
          {replyingTo?.commentId === comment._id && (
            <div className='mt-2'>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('reviews.replyTo', { name: comment.user.name })}
                className='w-full resize-none rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100'
                rows={2}
              />
              <div className='mt-2 flex justify-end space-x-2'>
                <Button
                  variant='ghost'
                  animated={false}
                  onClick={() => onReply()}
                  className='rounded-sm border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
                >
                  {t('reviews.cancel')}
                </Button>
                <Button
                  animated={false}
                  onClick={() => onCommentSubmit(comment.review, comment._id)}
                  disabled={isSubmittingComment || !commentText.trim()}
                  className='rounded-sm bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {isSubmittingComment ? t('reviews.sending') : t('reviews.send')}
                </Button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className='mt-3 border-l border-gray-200 pl-4 dark:border-slate-600'>
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  onReply={onReply}
                  replyingTo={replyingTo}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  onCommentSubmit={onCommentSubmit}
                  isSubmittingComment={isSubmittingComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductReviews
