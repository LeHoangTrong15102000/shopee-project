import { AnimatePresence, motion } from 'framer-motion'
import Button from 'src/components/Button'
import { filterPills, sortOptions } from '../wishlist.constants'

interface WishlistFiltersProps {
  activeFilter: string
  activeSort: string
  showSortDropdown: boolean
  onFilterChange: (filterId: string) => void
  onSortChange: (sortId: string) => void
  onToggleSortDropdown: () => void
}

export default function WishlistFilters({
  activeFilter,
  activeSort,
  showSortDropdown,
  onFilterChange,
  onSortChange,
  onToggleSortDropdown
}: WishlistFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
    >
      <div className='scrollbar-hide flex gap-2 overflow-x-auto pb-1'>
        {filterPills.map((pill) => (
          <Button
            animated={false}
            key={pill.id}
            onClick={() => onFilterChange(pill.id)}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:outline-hidden dark:focus:ring-orange-400 ${
              activeFilter === pill.id
                ? 'bg-[#ee4d2d] text-white shadow-md shadow-orange-500/25 dark:bg-orange-500'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-[#ee4d2d] hover:text-[#ee4d2d] dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-orange-400 dark:hover:text-orange-400'
            }`}
          >
            <pill.Icon className='h-3.5 w-3.5' />
            {pill.label}
          </Button>
        ))}
      </div>
      {/* Sort dropdown */}
      <div className='relative shrink-0'>
        <Button
          animated={false}
          onClick={onToggleSortDropdown}
          className='flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-[#ee4d2d] focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:outline-hidden dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-orange-400 dark:focus:ring-orange-400'
        >
          <span>Sắp xếp: {sortOptions.find((s) => s.id === activeSort)?.label}</span>
          <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </Button>
        <AnimatePresence>
          {showSortDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className='absolute top-full right-0 z-30 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-900/50'
            >
              {sortOptions.map((opt) => (
                <Button
                  animated={false}
                  key={opt.id}
                  onClick={() => {
                    onSortChange(opt.id)
                    onToggleSortDropdown()
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm transition-colors focus:ring-2 focus:ring-orange-500 focus:outline-hidden focus:ring-inset dark:focus:ring-orange-400 ${
                    activeSort === opt.id
                      ? 'bg-orange-50 font-medium text-[#ee4d2d] dark:bg-orange-900/20 dark:text-orange-400'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <opt.Icon className='h-4 w-4' /> {opt.label}
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
