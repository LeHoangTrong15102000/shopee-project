import { AnimatePresence, motion } from 'framer-motion'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchHistoryItem } from 'src/hooks/useSearchHistory'
import Button from 'src/components/Button'

interface SearchHistoryProps {
  history: SearchHistoryItem[]
  trendingSearches?: string[]
  onSelect: (query: string) => void
  onRemove: (query: string) => void
  onClearAll: () => void
}

const SearchHistory = memo(function SearchHistory({
  history,
  trendingSearches = ['iPhone 15', 'Áo thun nam', 'Laptop gaming', 'Tai nghe bluetooth', 'Giày sneaker'],
  onSelect,
  onRemove,
  onClearAll
}: SearchHistoryProps) {
  const { t } = useTranslation('home')
  const handleRemove = useCallback(
    (e: React.MouseEvent, query: string) => {
      e.stopPropagation()
      onRemove(query)
    },
    [onRemove]
  )

  return (
    <div className='absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800'>
      {/* Search History Section */}
      {history.length > 0 && (
        <div className='border-b border-gray-100 p-3 dark:border-slate-600'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>{t('search.recentSearches')}</span>
            <Button
              variant='text'
              size='xs'
              animated={false}
              onClick={onClearAll}
              className='text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
            >
              {t('filter.clearAll')}
            </Button>
          </div>
          <AnimatePresence mode='popLayout'>
            {history.map((item) => (
              <motion.div
                key={item.query}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className='group flex cursor-pointer items-center justify-between rounded-sm px-2 py-2 hover:bg-gray-50 dark:hover:bg-slate-700'
                onClick={() => onSelect(item.query)}
              >
                <div className='flex items-center gap-2'>
                  <svg className='h-4 w-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span className='text-sm text-gray-600 dark:text-gray-200'>{item.query}</span>
                </div>
                <Button
                  variant='ghost'
                  size='xs'
                  animated={false}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                    handleRemove(e as unknown as React.MouseEvent, item.query)
                  }
                  className='p-1 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500'
                  aria-label={`Xóa "${item.query}" khỏi lịch sử`}
                >
                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Trending Searches Section */}
      <div className='p-3'>
        <div className='mb-2 flex items-center gap-2'>
          <svg className='h-4 w-4 text-orange dark:text-orange-400' fill='currentColor' viewBox='0 0 24 24'>
            <path d='M17.56 21a1 1 0 01-.46-.11L12 18.22l-5.1 2.67a1 1 0 01-1.45-1.06l1-5.63-4.12-4a1 1 0 01-.25-1 1 1 0 01.81-.68l5.7-.83 2.51-5.13a1 1 0 011.8 0l2.54 5.12 5.7.83a1 1 0 01.81.68 1 1 0 01-.25 1l-4.12 4 1 5.63a1 1 0 01-.4 1 1 1 0 01-.62.21z' />
          </svg>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>{t('search.popularSearches')}</span>
        </div>
        <div className='flex flex-wrap gap-2'>
          {trendingSearches.map((term) => (
            <Button
              key={term}
              variant='ghost'
              size='xs'
              animated={false}
              onClick={() => onSelect(term)}
              className='rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-orange hover:text-white dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-orange-500 dark:hover:text-white'
            >
              {term}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
})

export default SearchHistory
