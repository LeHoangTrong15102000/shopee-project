import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { CreateReviewData } from 'src/types/review.type'
import { Purchase } from 'src/types/purchases.type'
import reviewApi from 'src/apis/review.api'
import ProductRating from 'src/components/ProductRating'
import Button from 'src/components/Button'

interface ProductReviewModalProps {
  isOpen: boolean
  onClose: () => void
  purchase: Purchase
}

const ProductReviewModal = ({ isOpen, onClose, purchase }: ProductReviewModalProps) => {
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')
  const [images, _setImages] = useState<string[]>([])

  const queryClient = useQueryClient()

  const createReviewMutation = useMutation({
    mutationFn: reviewApi.createReview
  })

  const handleSubmit = async () => {
    if (!rating || !comment.trim()) {
      toast.error('Vui lòng đánh giá và viết bình luận')
      return
    }

    if (comment.length < 10) {
      toast.error('Bình luận phải có ít nhất 10 ký tự')
      return
    }

    const reviewData: CreateReviewData = {
      purchase_id: purchase._id,
      rating,
      comment: comment.trim(),
      images
    }

    createReviewMutation.mutate(reviewData, {
      onSuccess: () => {
        toast.success('Đánh giá sản phẩm thành công!')
        queryClient.invalidateQueries({ queryKey: ['purchases'] })
        queryClient.invalidateQueries({ queryKey: ['product-reviews'] })
        onClose()
      },
      onError: (error) => {
        const axiosError = error as Error & { response?: { data?: { message?: string } } }
        toast.error(axiosError?.response?.data?.message || 'Có lỗi xảy ra')
      }
    })
  }

  const handleRatingClick = (value: number) => {
    setRating(value)
  }

  if (!isOpen) return null

  return (
    <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
      <div className='mx-4 max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-slate-800'>
        {/* Header */}
        <div className='flex items-center justify-between border-b p-6 dark:border-slate-700'>
          <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200'>Đánh Giá Sản Phẩm</h2>
          <button
            onClick={onClose}
            className='text-2xl font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className='max-h-[70vh] overflow-y-auto p-6'>
          {/* Product Info */}
          <div className='mb-6 flex items-center rounded-lg bg-gray-50 p-4 dark:bg-slate-700'>
            <img
              src={purchase.product.image}
              alt={purchase.product.name}
              className='h-16 w-16 rounded-sm border object-cover dark:border-slate-600'
            />
            <div className='ml-4 flex-1'>
              <h3 className='line-clamp-2 font-medium text-gray-800 dark:text-gray-200'>{purchase.product.name}</h3>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                Phân loại hàng:{' '}
                {typeof purchase.product.category === 'object'
                  ? purchase.product.category?.name
                  : purchase.product.category || 'Mặc định'}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className='mb-6'>
            <h4 className='mb-3 font-medium text-gray-800 dark:text-gray-200'>Chất lượng sản phẩm</h4>
            <div className='flex items-center space-x-2'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => handleRatingClick(star)} className='focus:outline-hidden'>
                  <svg
                    className={`h-8 w-8 ${star <= rating ? 'fill-current text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                    viewBox='0 0 20 20'
                  >
                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                  </svg>
                </button>
              ))}
              <span className='ml-2 font-medium text-orange-500'>
                {rating === 5 && 'Tuyệt vời'}
                {rating === 4 && 'Hài lòng'}
                {rating === 3 && 'Bình thường'}
                {rating === 2 && 'Không hài lòng'}
                {rating === 1 && 'Tệ'}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className='mb-6'>
            <h4 className='mb-3 font-medium text-gray-800 dark:text-gray-200'>Đánh giá của bạn</h4>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder='Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua khác nhé.'
              className='w-full resize-none rounded-md border border-gray-300 bg-white p-3 text-gray-900 outline-hidden focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100'
              rows={4}
              maxLength={2000}
            />
            <div className='mt-1 text-right text-sm text-gray-500 dark:text-gray-400'>{comment.length}/2000</div>
          </div>

          {/* Images Upload - Simplified for now */}
          <div className='mb-6'>
            <h4 className='mb-3 font-medium text-gray-800 dark:text-gray-200'>Thêm Hình ảnh</h4>
            <div className='flex items-center space-x-4'>
              <div className='flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 dark:border-slate-600'>
                <div className='text-center'>
                  <svg
                    className='mx-auto mb-1 h-8 w-8 text-gray-400 dark:text-gray-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                  </svg>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>Thêm Hình ảnh</p>
                </div>
              </div>
            </div>
            <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>Tối đa 10 hình ảnh</p>
          </div>

          {/* Service Rating */}
          <div className='mb-6'>
            <h4 className='mb-3 font-medium text-gray-800 dark:text-gray-200'>Về Dịch vụ</h4>

            <div className='mb-4'>
              <label className='mb-2 block text-sm text-gray-700 dark:text-gray-300'>Dịch vụ của người bán</label>
              <ProductRating
                rating={5}
                activeClassname='w-5 h-5 fill-yellow-400 text-yellow-400'
                nonActiveClassname='w-5 h-5 fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
              />
              <span className='ml-2 text-sm text-orange-500'>Tuyệt vời</span>
            </div>

            <div className='mb-4'>
              <label className='mb-2 block text-sm text-gray-700 dark:text-gray-300'>Dịch vụ vận chuyển</label>
              <ProductRating
                rating={5}
                activeClassname='w-5 h-5 fill-yellow-400 text-yellow-400'
                nonActiveClassname='w-5 h-5 fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
              />
              <span className='ml-2 text-sm text-orange-500'>Tuyệt vời</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end space-x-3 border-t bg-gray-50 p-6 dark:border-slate-700 dark:bg-slate-900'>
          <Button
            onClick={onClose}
            variant='secondary'
            animated={false}
            className='rounded-sm border border-gray-300 px-6 py-2 text-gray-600 hover:bg-gray-100 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
          >
            Trở Lại
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createReviewMutation.isPending || !rating || !comment.trim()}
            animated={false}
            className='rounded-sm bg-orange-500 px-6 py-2 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {createReviewMutation.isPending ? 'Đang gửi...' : 'Hoàn Thành'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProductReviewModal
