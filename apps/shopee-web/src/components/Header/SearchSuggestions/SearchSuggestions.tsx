import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'react-toastify'
import Button from 'src/components/Button'
import productApi from 'src/apis/product.api'
import path from 'src/constant/path'
import useDebounce from 'src/hooks/useDebounce'
import { RetryError } from 'src/types/utils.type'
import { generateNameId } from 'src/utils/utils'
import SearchHistoryItem from './SearchHistoryItem'
import SearchSuggestionItem from './SearchSuggestionItem'

interface Props {
  searchValue: string
  isVisible: boolean
  onSelectSuggestion: (suggestion: string) => void
  onHide: () => void
}

// Mock data để fallback khi API lỗi
const mockProducts = [
  {
    _id: 'mock-1',
    name: 'iPhone 15 Pro Max',
    image: '/src/assets/images/img-product-incart.png',
    price: 28999000
  },
  {
    _id: 'mock-2',
    name: 'Samsung Galaxy S24 Ultra',
    image: '/src/assets/images/img-product-incart.png',
    price: 25999000
  },
  {
    _id: 'mock-3',
    name: 'MacBook Pro M3',
    image: '/src/assets/images/img-product-incart.png',
    price: 45999000
  }
]

/**
 * SearchSuggestions Component với Query Cancellation
 * Tự động hủy các request search cũ khi user gõ tiếp
 */
const SearchSuggestions = ({ searchValue, isVisible, onSelectSuggestion, onHide }: Props) => {
  const queryClient = useQueryClient()
  const debouncedSearchValue = useDebounce(searchValue, 300) // Giảm từ 500ms xuống 300ms cho responsive hơn
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // State để track các hình ảnh bị lỗi và ngăn re-render liên tục
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  /**
   * Query để lấy search suggestions với Query Cancellation
   * TanStack Query sẽ tự động hủy request cũ khi debouncedSearchValue thay đổi
   */
  const {
    data: suggestionsData,
    isError: suggestionsError,
    isFetching
  } = useQuery({
    queryKey: ['searchSuggestions', debouncedSearchValue],
    queryFn: ({ signal }) => {
      // Truyền AbortSignal vào API call để support cancellation
      return productApi.getSearchSuggestions({ q: debouncedSearchValue || '' }, { signal })
    },
    enabled: Boolean(debouncedSearchValue?.trim()) && (debouncedSearchValue?.length ?? 0) > 1,
    staleTime: 30000, // Cache 30 giây
    retry: (failureCount, error: RetryError) => {
      // Không retry nếu request bị abort (do cancellation)
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        return false
      }
      return failureCount < 1 // Retry tối đa 1 lần nếu lỗi khác
    }
  })

  /**
   * Query để lấy search history với Query Cancellation
   */
  const { data: historyData, isError: historyError } = useQuery({
    queryKey: ['searchHistory'],
    queryFn: ({ signal }) => {
      // Truyền AbortSignal vào API call
      return productApi.getSearchHistory({ signal })
    },
    staleTime: 60000, // Cache 1 phút
    retry: (failureCount, error: RetryError) => {
      // Không retry nếu request bị abort
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        return false
      }
      return failureCount < 1
    }
  })

  /**
   * Mutation để xóa một keyword khỏi lịch sử tìm kiếm
   */
  const deleteHistoryItemMutation = useMutation({
    mutationFn: (keyword: string) => productApi.deleteSearchHistoryItem(keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] })
      toast.success('Đã xóa khỏi lịch sử tìm kiếm')
    },
    onError: () => {
      toast.error('Không thể xóa lịch sử tìm kiếm')
    }
  })

  /**
   * Mutation để xóa toàn bộ lịch sử tìm kiếm
   */
  const clearHistoryMutation = useMutation({
    mutationFn: () => productApi.deleteSearchHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] })
      toast.success('Đã xóa toàn bộ lịch sử tìm kiếm')
    },
    onError: () => {
      toast.error('Không thể xóa lịch sử tìm kiếm')
    }
  })

  useEffect(() => {
    if (historyData?.data.data) {
      setSearchHistory(historyData.data.data)
    } else if (historyError) {
      // Fallback với mock data khi API lỗi
      setSearchHistory(['điện thoại', 'áo thun', 'giày thể thao', 'laptop'])
    }
  }, [historyData, historyError])

  // Reset failed images khi search value thay đổi
  useEffect(() => {
    setFailedImages(new Set())
  }, [debouncedSearchValue])

  // Fallback data khi API lỗi - dùng useMemo để tối ưu performance
  const suggestions = useMemo(
    () =>
      suggestionsData?.data.data.suggestions ||
      (suggestionsError && debouncedSearchValue
        ? [
            `${debouncedSearchValue} samsung`,
            `${debouncedSearchValue} iphone`,
            `${debouncedSearchValue} oppo`,
            `${debouncedSearchValue} xiaomi`
          ].filter((item) => item.trim() !== debouncedSearchValue)
        : []),
    [suggestionsData, suggestionsError, debouncedSearchValue]
  )

  const products = useMemo(
    () =>
      suggestionsData?.data.data.products ||
      (suggestionsError && debouncedSearchValue
        ? mockProducts.filter((product) => product.name.toLowerCase().includes(debouncedSearchValue.toLowerCase()))
        : []),
    [suggestionsData, suggestionsError, debouncedSearchValue]
  )

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      onSelectSuggestion(suggestion)

      // Lưu vào search history với error handling và cancellation support
      productApi.saveSearchHistory({ keyword: suggestion }, {}).catch((error) => {
        // Bỏ qua lỗi nếu request bị cancel
        if (error?.name !== 'AbortError' && error?.code !== 'ERR_CANCELED') {
          console.warn('Không thể lưu lịch sử tìm kiếm:', error)
        }
      })
      onHide()
    },
    [onSelectSuggestion, onHide]
  )

  // Xử lý lỗi hình ảnh - chỉ thay đổi source một lần duy nhất
  const handleImageError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>, productId: string) => {
      const img = event.target as HTMLImageElement

      // Kiểm tra xem hình ảnh này đã bị lỗi chưa
      if (!failedImages.has(productId)) {
        // Đánh dấu hình ảnh này đã lỗi
        setFailedImages((prev) => new Set(prev).add(productId))

        // Thay thế bằng hình ảnh placeholder an toàn (base64 SVG)
        img.src =
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMiAxNkwyOCAyNE0yOCAxNkwxMiAyNCIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K'
      }
    },
    [failedImages]
  )

  // Tạo component ProductItem để tối ưu rendering
  const ProductItem = React.memo(
    ({ product }: { product: { _id: string; name: string; image: string; price: number } }) => {
      const imageUrl = failedImages.has(product._id)
        ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMiAxNkwyOCAyNE0yOCAxNkwxMiAyNCIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K'
        : product.image

      return (
        <Link
          key={product._id}
          to={`${path.products}${generateNameId({ name: product.name, id: product._id })}`}
          className='-mx-2 flex items-center rounded-sm px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700'
          onClick={onHide}
        >
          <div className='mr-2 h-8 w-8 shrink-0 md:mr-3 md:h-10 md:w-10'>
            <img
              src={imageUrl}
              alt={product.name}
              className='h-full w-full rounded-sm border border-gray-200 bg-gray-100 object-cover dark:border-slate-600 dark:bg-slate-700'
              onError={(e) => handleImageError(e, product._id)}
              loading='lazy'
            />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='truncate text-xs leading-tight font-medium text-gray-900 md:text-sm dark:text-gray-100'>
              {product.name}
            </div>
            <div className='text-xs font-semibold text-orange'>₫{product.price.toLocaleString('vi-VN')}</div>
          </div>
          <div className='shrink-0'>
            <svg
              className='h-3 w-3 text-gray-400 md:h-4 md:w-4 dark:text-gray-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </div>
        </Link>
      )
    }
  )

  if (!isVisible) return null

  // Hiển thị loading state khi đang fetch
  const showLoading = isFetching && (debouncedSearchValue?.length ?? 0) > 1

  return (
    <div className='absolute top-full right-0 left-0 z-50 max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg sm:max-h-96 dark:border-slate-700 dark:bg-slate-800'>
      {showLoading && (
        <div className='flex items-center justify-center py-4'>
          <div className='h-5 w-5 animate-spin rounded-full border-b-2 border-orange'></div>
          <span className='ml-2 text-sm text-gray-600 dark:text-gray-200'>Đang tìm kiếm...</span>
        </div>
      )}

      {!showLoading && (debouncedSearchValue?.length ?? 0) > 1 && (
        <>
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className='border-b border-gray-100 dark:border-slate-700'>
              <div className='px-4 py-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-300'>
                Gợi ý tìm kiếm
              </div>
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <SearchSuggestionItem
                  key={index}
                  suggestion={suggestion}
                  searchValue={debouncedSearchValue || ''}
                  onSelect={() => handleSelectSuggestion(suggestion)}
                />
              ))}
            </div>
          )}

          {/* Product Results */}
          {products.length > 0 && (
            <div>
              <div className='px-4 py-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-300'>
                Sản phẩm ({products.length > 5 ? '5+' : products.length})
              </div>
              <div className='px-4 pb-2'>
                {products.slice(0, 5).map((product) => (
                  <ProductItem key={product._id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {suggestions.length === 0 && products.length === 0 && !showLoading && (
            <div className='px-4 py-6 text-center text-gray-500 dark:text-gray-200'>
              <svg
                className='mx-auto mb-2 h-8 w-8 text-gray-400 dark:text-gray-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
              <p className='text-sm'>Không tìm thấy kết quả cho "{debouncedSearchValue}"</p>
            </div>
          )}
        </>
      )}

      {/* Search History - Hiển thị khi không có search value */}
      {!debouncedSearchValue && searchHistory.length > 0 && (
        <div>
          <div className='flex items-center justify-between px-4 py-2'>
            <span className='text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-300'>
              Lịch sử tìm kiếm
            </span>
            <Button
              animated={false}
              onClick={() => clearHistoryMutation.mutate()}
              disabled={clearHistoryMutation.isPending}
              className='text-xs text-orange hover:underline disabled:opacity-50'
            >
              Xóa tất cả
            </Button>
          </div>
          {searchHistory.slice(0, 5).map((item, index) => (
            <SearchHistoryItem
              key={index}
              historyItem={item}
              onSelect={() => handleSelectSuggestion(item)}
              onDelete={() => deleteHistoryItemMutation.mutate(item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchSuggestions
