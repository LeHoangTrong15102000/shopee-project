import { useState, useEffect, useCallback } from 'react'
import useSocket from './useSocket'
import { SocketEvent, NewReviewPayload, NewReviewCommentPayload, ReviewLikedPayload } from 'src/types/socket.types'

interface UseLiveReviewsReturn {
  newReviews: NewReviewPayload['review'][]
  newComments: (NewReviewCommentPayload & { comment: NewReviewCommentPayload['comment'] })[]
  likeUpdates: Map<string, number>
  clearNewReviews: () => void
}

const useLiveReviews = (productId: string | undefined): UseLiveReviewsReturn => {
  const { socket, isConnected } = useSocket()
  const [newReviews, setNewReviews] = useState<NewReviewPayload['review'][]>([])
  const [newComments, setNewComments] = useState<
    (NewReviewCommentPayload & { comment: NewReviewCommentPayload['comment'] })[]
  >([])
  const [likeUpdates, setLikeUpdates] = useState<Map<string, number>>(new Map())

  const clearNewReviews = useCallback(() => {
    setNewReviews([])
  }, [])

  useEffect(() => {
    if (!socket || !isConnected || !productId) return

    const handleNewReview = (data: NewReviewPayload) => {
      if (data.product_id === productId) {
        setNewReviews((prev) => [...prev, data.review])
      }
    }

    const handleNewComment = (data: NewReviewCommentPayload) => {
      if (data.product_id === productId) {
        setNewComments((prev) => [...prev, data])
      }
    }

    const handleReviewLiked = (data: ReviewLikedPayload) => {
      if (data.product_id === productId) {
        setLikeUpdates((prev) => {
          const next = new Map(prev)
          next.set(data.review_id, data.helpful_count)
          return next
        })
      }
    }

    socket.on(SocketEvent.NEW_REVIEW, handleNewReview)
    socket.on(SocketEvent.NEW_REVIEW_COMMENT, handleNewComment)
    socket.on(SocketEvent.REVIEW_LIKED, handleReviewLiked)

    return () => {
      socket.off(SocketEvent.NEW_REVIEW, handleNewReview)
      socket.off(SocketEvent.NEW_REVIEW_COMMENT, handleNewComment)
      socket.off(SocketEvent.REVIEW_LIKED, handleReviewLiked)
      setNewReviews([])
      setNewComments([])
      setLikeUpdates(new Map())
    }
  }, [socket, isConnected, productId])

  return { newReviews, newComments, likeUpdates, clearNewReviews }
}

export default useLiveReviews
