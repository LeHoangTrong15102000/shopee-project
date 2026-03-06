import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import chatbotApi from 'src/apis/chatbot.api'
import SEO from 'src/components/SEO'
import Button from 'src/components/Button'
import { ConversationSummary } from 'src/types/chatbot.type'
import { useReducedMotion } from 'src/hooks/useReducedMotion'

const ConversationHistory = () => {
  const queryClient = useQueryClient()
  const reducedMotion = useReducedMotion()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatbotApi.getConversations()
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatbotApi.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Xóa hội thoại thành công')
      setDeletingId(null)
    },
    onError: () => {
      toast.error('Xóa hội thoại thất bại')
      setDeletingId(null)
    }
  })

  const conversations: ConversationSummary[] = data?.data?.data?.conversations || []

  const handleDelete = (id: string) => {
    setDeletingId(id)
  }

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className='rounded-sm bg-white px-4 pb-10 shadow md:px-7 md:pb-20 dark:bg-slate-800'>
      <SEO title='Lịch sử hội thoại | Shopee Clone' description='Quản lý lịch sử hội thoại với trợ lý AI' />
      <div className='border-b border-b-gray-200 py-6 dark:border-b-slate-700'>
        <h1 className='text-lg font-medium text-gray-900 capitalize dark:text-gray-100'>Lịch sử hội thoại</h1>
        <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>Quản lý các cuộc hội thoại với trợ lý AI</div>
      </div>

      {isLoading && (
        <div className='flex items-center justify-center py-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-[#ee4d2d] border-t-transparent' />
        </div>
      )}

      {!isLoading && conversations.length === 0 && (
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
              d='M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155'
            />
          </svg>
          <p className='text-gray-500 dark:text-gray-400'>Chưa có cuộc hội thoại nào</p>
        </div>
      )}

      {!isLoading && conversations.length > 0 && (
        <AnimatePresence>
          <ul className='divide-y divide-gray-100 dark:divide-slate-700'>
            {conversations.map((conv) => (
              <motion.li
                key={conv._id}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, x: -20 }}
                className='flex items-center justify-between py-4'
              >
                <div className='min-w-0 flex-1'>
                  <h3 className='truncate font-medium text-gray-900 dark:text-gray-100'>{conv.title}</h3>
                  <div className='mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400'>
                    <span>{formatDate(conv.lastActivity || conv.updatedAt)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${conv.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'}`}
                    >
                      {conv.status === 'active' ? 'Đang hoạt động' : 'Đã lưu trữ'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(conv._id)}
                  className='ml-4 shrink-0 rounded p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20'
                  aria-label={`Xóa hội thoại ${conv.title}`}
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

      {/* Delete confirmation dialog */}
      {deletingId && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
          role='dialog'
          aria-modal='true'
        >
          <div className='mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>Xác nhận xóa</h3>
            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
              Bạn có chắc muốn xóa cuộc hội thoại này? Hành động này không thể hoàn tác.
            </p>
            <div className='mt-4 flex justify-end gap-3'>
              <Button
                onClick={() => setDeletingId(null)}
                className='rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300'
              >
                Hủy
              </Button>
              <Button
                onClick={confirmDelete}
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

export default ConversationHistory
