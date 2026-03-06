import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import priceHistoryApi from 'src/apis/priceHistory.api'
import SEO from 'src/components/SEO'
import Button from 'src/components/Button'
import { PriceAlert } from 'src/types/priceHistory.type'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { formatCurrency } from 'src/utils/utils'

type StatusFilter = 'all' | 'active' | 'triggered'

const PriceAlerts = () => {
  const queryClient = useQueryClient()
  const reducedMotion = useReducedMotion()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['priceAlerts'],
    queryFn: () => priceHistoryApi.getPriceAlerts()
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => priceHistoryApi.deletePriceAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceAlerts'] })
      toast.success('Xóa thông báo giá thành công')
      setDeletingId(null)
    },
    onError: () => {
      toast.error('Xóa thông báo giá thất bại')
      setDeletingId(null)
    }
  })

  const alerts: PriceAlert[] = data?.data?.data || []

  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') return alert.is_active
    if (statusFilter === 'triggered') return !alert.is_active
    return true
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'active', label: 'Đang theo dõi' },
    { key: 'triggered', label: 'Đã kích hoạt' }
  ]

  return (
    <div className='rounded-sm bg-white px-4 pb-10 shadow md:px-7 md:pb-20 dark:bg-slate-800'>
      <SEO title='Thông báo giá | Shopee Clone' description='Quản lý thông báo giảm giá sản phẩm' />
      <div className='border-b border-b-gray-200 py-6 dark:border-b-slate-700'>
        <h1 className='text-lg font-medium text-gray-900 capitalize dark:text-gray-100'>Thông báo giá</h1>
        <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>Quản lý các thông báo khi giá sản phẩm giảm</div>
      </div>

      {/* Filter tabs */}
      <div className='mt-4 flex gap-2 border-b border-gray-100 pb-4 dark:border-slate-700'>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${statusFilter === tab.key ? 'bg-[#ee4d2d] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className='flex items-center justify-center py-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-[#ee4d2d] border-t-transparent' />
        </div>
      )}

      {!isLoading && filteredAlerts.length === 0 && (
        <div className='flex flex-col items-center justify-center py-20'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='mb-4 h-16 w-16 text-gray-300 dark:text-gray-600'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
            />
          </svg>
          <p className='text-gray-500 dark:text-gray-400'>Chưa có thông báo giá nào</p>
          <p className='mt-1 text-sm text-gray-400 dark:text-gray-500'>Duyệt sản phẩm và đặt thông báo khi giá giảm</p>
        </div>
      )}

      {!isLoading && filteredAlerts.length > 0 && (
        <AnimatePresence>
          <ul className='divide-y divide-gray-100 dark:divide-slate-700'>
            {filteredAlerts.map((alert) => (
              <motion.li
                key={alert._id}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, x: -20 }}
                className='flex items-center justify-between py-4'
              >
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                      Sản phẩm: {alert.product_id}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${alert.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}
                    >
                      {alert.is_active ? 'Đang theo dõi' : 'Đã kích hoạt'}
                    </span>
                  </div>
                  <div className='mt-1 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400'>
                    <span>
                      Giá mục tiêu:{' '}
                      <span className='font-medium text-[#ee4d2d]'>₫{formatCurrency(alert.target_price)}</span>
                    </span>
                    <span>Ngày tạo: {formatDate(alert.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setDeletingId(alert._id)}
                  className='ml-4 shrink-0 rounded p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20'
                  aria-label='Xóa thông báo giá'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'
                    />
                  </svg>
                </button>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
          role='dialog'
          aria-modal='true'
        >
          <div className='mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>Xác nhận xóa</h3>
            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>Bạn có chắc muốn xóa thông báo giá này?</p>
            <div className='mt-4 flex justify-end gap-3'>
              <Button
                onClick={() => setDeletingId(null)}
                className='rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300'
              >
                Hủy
              </Button>
              <Button
                onClick={() => deletingId && deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className='rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50'
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PriceAlerts
