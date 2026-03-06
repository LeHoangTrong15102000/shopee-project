import { motion, AnimatePresence } from 'framer-motion'
import { chipVariants } from '../orderSearchFilter.constants'
import { formatCurrency } from 'src/utils/utils'
import Button from 'src/components/Button'

interface ActiveFilterChipsProps {
  reducedMotion: boolean
  totalResults?: number
  searchQuery: string
  dateRange: { from: string; to: string } | null
  priceRange: { min: number; max: number } | null
  hasSearchFilter: boolean
  hasDateFilter: boolean
  hasPriceFilter: boolean
  hasAnyFilter: boolean
  onClearSearch: () => void
  onClearDateRange: () => void
  onClearPriceRange: () => void
  onClearAllFilters: () => void
}

export default function ActiveFilterChips({
  reducedMotion,
  totalResults,
  searchQuery,
  dateRange,
  priceRange,
  hasSearchFilter,
  hasDateFilter,
  hasPriceFilter,
  hasAnyFilter,
  onClearSearch,
  onClearDateRange,
  onClearPriceRange,
  onClearAllFilters
}: ActiveFilterChipsProps) {
  return (
    <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
      <div className='flex flex-wrap items-center gap-2'>
        {totalResults !== undefined && (
          <span className='text-sm text-gray-600 dark:text-gray-300'>Tìm thấy {totalResults} đơn hàng</span>
        )}

        <AnimatePresence mode='popLayout'>
          {hasSearchFilter && (
            <motion.div
              key='search-chip'
              variants={reducedMotion ? undefined : chipVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              className='inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#ee4d2d]'
            >
              <span className='max-w-[150px] truncate'>"{searchQuery}"</span>
              <Button
                variant='ghost'
                animated={false}
                type='button'
                onClick={onClearSearch}
                className='rounded-full p-0.5 transition-colors hover:bg-[#ee4d2d]/20'
                aria-label='Xóa bộ lọc tìm kiếm'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                  className='h-3 w-3'
                  aria-hidden='true'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' />
                </svg>
              </Button>
            </motion.div>
          )}

          {hasDateFilter && (
            <motion.div
              key='date-chip'
              variants={reducedMotion ? undefined : chipVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              className='inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#ee4d2d]'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='h-3 w-3'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5'
                />
              </svg>
              <span>
                {dateRange?.from} - {dateRange?.to}
              </span>
              <Button
                variant='ghost'
                animated={false}
                type='button'
                onClick={onClearDateRange}
                className='rounded-full p-0.5 transition-colors hover:bg-[#ee4d2d]/20'
                aria-label='Xóa bộ lọc ngày'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                  className='h-3 w-3'
                  aria-hidden='true'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' />
                </svg>
              </Button>
            </motion.div>
          )}

          {hasPriceFilter && (
            <motion.div
              key='price-chip'
              variants={reducedMotion ? undefined : chipVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              className='inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#ee4d2d]'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='h-3 w-3'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
                />
              </svg>
              <span>
                ₫{formatCurrency(priceRange?.min || 0)} - ₫{formatCurrency(priceRange?.max || 0)}
              </span>
              <Button
                variant='ghost'
                animated={false}
                type='button'
                onClick={onClearPriceRange}
                className='rounded-full p-0.5 transition-colors hover:bg-[#ee4d2d]/20'
                aria-label='Xóa bộ lọc giá'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                  className='h-3 w-3'
                  aria-hidden='true'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' />
                </svg>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hasAnyFilter && (
        <Button
          variant='text'
          animated={false}
          type='button'
          onClick={onClearAllFilters}
          className='text-sm font-medium text-[#ee4d2d] underline transition-colors hover:text-[#d73211]'
        >
          Xóa tất cả bộ lọc
        </Button>
      )}
    </div>
  )
}
