import { motion } from 'framer-motion'
import Button from 'src/components/Button'

interface DeleteConfirmModalProps {
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
  title?: string
  message?: string
}

const DeleteConfirmModal = ({
  onConfirm,
  onCancel,
  isLoading,
  title = 'Xóa địa chỉ',
  message = 'Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.'
}: DeleteConfirmModalProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className='w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='mb-4 flex items-center justify-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
            <svg
              className='h-6 w-6 text-red-600 dark:text-red-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
              />
            </svg>
          </div>
        </div>
        <h3 className='mb-2 text-center text-lg font-medium text-gray-900 dark:text-gray-100'>{title}</h3>
        <p className='mb-6 text-center text-sm text-gray-500 dark:text-gray-400'>{message}</p>
        <div className='flex gap-3'>
          <Button
            onClick={onCancel}
            className='flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
          >
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            isLoading={isLoading}
            className='flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50'
          >
            Xóa
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DeleteConfirmModal
