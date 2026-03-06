import { AnimatePresence, motion } from 'framer-motion'
import Button from 'src/components/Button'
import ShopeeCheckbox from 'src/components/ShopeeCheckbox'
import { AddressType } from 'src/types/checkout.type'

type FilterType = 'all' | AddressType

interface AddressBookToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterType: FilterType
  onFilterChange: (type: FilterType) => void
  addressCounts: Record<FilterType, number>
  isSelectionMode: boolean
  selectedCount: number
  totalSelectableCount: number
  onSelectAll: () => void
  onBulkDelete: () => void
  ADDRESS_TYPE_CONFIG: Record<AddressType, { label: string; icon: React.ReactNode; color: string }>
}

const AddressBookToolbar = ({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  addressCounts,
  isSelectionMode,
  selectedCount,
  totalSelectableCount,
  onSelectAll,
  onBulkDelete,
  ADDRESS_TYPE_CONFIG
}: AddressBookToolbarProps) => {
  return (
    <div className='mt-6 space-y-4'>
      {/* Search Box */}
      <div className='relative'>
        <svg
          className='absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400'
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
        <input
          type='text'
          placeholder='Tìm kiếm theo tên, số điện thoại, địa chỉ...'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 text-sm transition-colors focus:border-orange focus:ring-1 focus:ring-orange/30 focus:outline-hidden dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100 dark:focus:border-orange-400 dark:focus:ring-orange-400/30'
        />
        {searchQuery && (
          <Button
            onClick={() => onSearchChange('')}
            variant='text'
            animated={false}
            className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          >
            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className='flex flex-wrap gap-2'>
        {(['all', 'home', 'office', 'other'] as FilterType[]).map((type) => {
          const isActive = filterType === type
          const count = addressCounts[type]
          const config = type === 'all' ? null : ADDRESS_TYPE_CONFIG[type]
          return (
            <Button
              key={type}
              onClick={() => onFilterChange(type)}
              animated={false}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange text-white shadow-md dark:bg-orange-500 dark:text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {config && <span className={isActive ? 'text-white' : ''}>{config.icon}</span>}
              {type === 'all' ? 'Tất cả' : config?.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-600'}`}
              >
                {count}
              </span>
            </Button>
          )
        })}
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {isSelectionMode && selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className='flex flex-col gap-3 rounded-lg bg-orange/5 p-3 sm:flex-row sm:items-center sm:justify-between dark:bg-orange-400/10'
          >
            <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
              <div className='flex items-center gap-2 text-sm text-gray-600 select-none dark:text-gray-300'>
                <ShopeeCheckbox checked={selectedCount === totalSelectableCount} onChange={onSelectAll} size='sm' />
                <span className='cursor-pointer hover:text-orange dark:hover:text-orange-400' onClick={onSelectAll}>
                  Chọn tất cả
                </span>
              </div>
              <span className='text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
                Đã chọn {selectedCount} địa chỉ
              </span>
            </div>
            <Button
              onClick={onBulkDelete}
              className='flex w-full items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 sm:w-auto'
            >
              Xóa đã chọn
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AddressBookToolbar
