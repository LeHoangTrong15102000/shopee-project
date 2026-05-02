import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {
  getProductDetail,
  getProductReviews,
  getQuestions,
  checkWishlist,
  getRelatedProducts,
  addToWishlist,
  removeFromWishlist,
  addToCart as addToCartApi,
  buyNow as buyNowApi,
  createReview as createReviewApi,
  toggleReviewLike as toggleReviewLikeApi,
  askQuestion as askQuestionApi,
  answerQuestion as answerQuestionApi,
  likeQuestion as likeQuestionApi,
  type Review,
  type Question,
} from '@/apis/product-detail.api'
import { useToast } from '@/components/ui/ToastProvider'
import { useTranslation } from 'react-i18next'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Data Types ─────────────────────────────────────────────────────────

type ApiResponse<T> = { message: string; data: T }
type WishlistData = ApiResponse<{ in_wishlist: boolean }>
type ReviewsPage = ApiResponse<{
  reviews: Review[]
  pagination: import('@/apis/product-detail.api').Pagination
  stats: import('@/apis/product-detail.api').ReviewStats
}>
type QuestionsPage = ApiResponse<{
  questions: Question[]
  pagination: import('@/apis/product-detail.api').Pagination
}>

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export function useProductDetailQuery(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProductDetail(productId),
    enabled: !!productId,
  })
}

export function useProductReviews(productId: string) {
  return useInfiniteQuery({
    queryKey: ['reviews', productId],
    queryFn: ({ pageParam }) => getProductReviews(productId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.data.pagination
      return page < total_pages ? page + 1 : undefined
    },
    enabled: !!productId,
  })
}

export function useProductQuestions(productId: string) {
  return useInfiniteQuery({
    queryKey: ['questions', productId],
    queryFn: ({ pageParam }) => getQuestions(productId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.data.pagination
      return page < total_pages ? page + 1 : undefined
    },
    enabled: !!productId,
  })
}

export function useWishlistStatus(productId: string) {
  return useQuery({
    queryKey: ['wishlist', productId],
    queryFn: () => checkWishlist(productId),
    enabled: !!productId,
  })
}

export function useRelatedProducts(categoryId: string | undefined, excludeProductId: string) {
  return useQuery({
    queryKey: ['related-products', categoryId, excludeProductId],
    queryFn: () => getRelatedProducts(categoryId!, excludeProductId),
    enabled: !!categoryId && !!excludeProductId,
  })
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

export function useToggleWishlist(productId: string) {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (inWishlist: boolean) =>
      inWishlist ? removeFromWishlist(productId) : addToWishlist(productId),
    onMutate: async (inWishlist) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist', productId] })
      const previous = queryClient.getQueryData(['wishlist', productId])
      queryClient.setQueryData(['wishlist', productId], (old: WishlistData | undefined) => {
        if (!old) return old
        return { ...old, data: { in_wishlist: !inWishlist } }
      })
      return { previous }
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(['wishlist', productId], context?.previous)
      handleMutationError(error)
    },
    onSuccess: (_data, inWishlist) => {
      showSuccess(inWishlist ? t('PD_WISHLIST_REMOVED') : t('PD_WISHLIST_ADDED'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', productId] })
    },
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (body: { product_id: string; buy_count: number }) => addToCartApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      showSuccess(t('PD_ADD_TO_CART_SUCCESS'))
    },
    onError: handleMutationError,
  })
}

export function useBuyNow() {
  const { showSuccess } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (body: { product_id: string; buy_count: number }) => buyNowApi(body),
    onSuccess: () => showSuccess(t('PD_BUY_NOW_SUCCESS')),
    onError: handleMutationError,
  })
}
export function useCreateReview(productId: string) {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (body: {
      purchase_id: string
      rating: number
      comment: string
      images?: string[]
    }) => createReviewApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
      showSuccess(t('PD_REVIEW_SUCCESS'))
    },
    onError: handleMutationError,
  })
}

export function useToggleReviewLike(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reviewId: string) => toggleReviewLikeApi(reviewId),
    onMutate: async (reviewId) => {
      await queryClient.cancelQueries({ queryKey: ['reviews', productId] })
      const previous = queryClient.getQueryData(['reviews', productId])
      queryClient.setQueryData(
        ['reviews', productId],
        (old: InfiniteData<ReviewsPage> | undefined) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                reviews: page.data.reviews.map((r: Review) =>
                  r._id === reviewId
                    ? {
                        ...r,
                        is_liked: !r.is_liked,
                        helpful_count: r.is_liked ? r.helpful_count - 1 : r.helpful_count + 1,
                      }
                    : r
                ),
              },
            })),
          }
        }
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(['reviews', productId], context?.previous)
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
    },
  })
}

export function useAskQuestion(productId: string) {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (body: { product_id: string; question: string }) => askQuestionApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', productId] })
      showSuccess(t('PD_QUESTION_SUCCESS'))
    },
    onError: handleMutationError,
  })
}

export function useAnswerQuestion(productId: string) {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: string }) =>
      answerQuestionApi(questionId, { answer }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', productId] })
      showSuccess(t('PD_ANSWER_SUCCESS'))
    },
    onError: handleMutationError,
  })
}

export function useLikeQuestion(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (questionId: string) => likeQuestionApi(questionId),
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({ queryKey: ['questions', productId] })
      const previous = queryClient.getQueryData(['questions', productId])
      queryClient.setQueryData(
        ['questions', productId],
        (old: InfiniteData<QuestionsPage> | undefined) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                questions: page.data.questions.map((q: Question) =>
                  q._id === questionId
                    ? {
                        ...q,
                        is_liked: !q.is_liked,
                        likes_count: q.is_liked ? q.likes_count - 1 : q.likes_count + 1,
                      }
                    : q
                ),
              },
            })),
          }
        }
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(['questions', productId], context?.previous)
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', productId] })
    },
  })
}
