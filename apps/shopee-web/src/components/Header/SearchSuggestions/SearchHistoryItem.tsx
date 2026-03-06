import React from 'react'

interface Props {
  historyItem: string
  onSelect: () => void
  onDelete?: () => void
}

const SearchHistoryItem = ({ historyItem, onSelect, onDelete }: Props) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  return (
    <div
      className='group flex cursor-pointer items-center px-4 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700'
      onClick={onSelect}
    >
      <svg
        className='mr-2 h-3 w-3 shrink-0 text-gray-400 md:mr-3 md:h-4 md:w-4 dark:text-gray-500'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
      <span className='flex-1 text-xs leading-tight text-gray-600 md:text-sm dark:text-gray-100'>{historyItem}</span>
      {onDelete && (
        <button
          onClick={handleDelete}
          className='rounded-sm p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-slate-600'
          title='Xóa khỏi lịch sử'
        >
          <svg
            className='h-3 w-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      )}
    </div>
  )
}

export default SearchHistoryItem
