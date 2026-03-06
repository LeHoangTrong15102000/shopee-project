import { motion } from 'framer-motion'
import Button from 'src/components/Button'

type FilterType = 'all' | 'home' | 'office' | 'other'

interface NoResultsStateProps {
  searchQuery: string
  filterType: FilterType
  onClear: () => void
}

const NoResultsState = ({ searchQuery, filterType, onClear }: NoResultsStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 dark:border-slate-600 dark:bg-slate-900'
    >
      <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700'>
        <svg className='h-8 w-8 text-gray-400 dark:text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      </div>
      <h3 className='mt-4 text-lg font-medium text-gray-700 dark:text-gray-200'>Không tìm thấy địa chỉ</h3>
      <p className='mt-2 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400'>
        {searchQuery
          ? `Không có địa chỉ nào phù hợp với "${searchQuery}"`
          : `Không có địa chỉ nào thuộc loại "${filterType === 'home' ? 'Nhà riêng' : filterType === 'office' ? 'Văn phòng' : 'Khác'}"`}
      </p>
      <Button
        onClick={onClear}
        className='mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
      >
        Xóa bộ lọc
      </Button>
    </motion.div>
  )
}

export default NoResultsState
