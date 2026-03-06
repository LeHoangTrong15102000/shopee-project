import classNames from 'classnames'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import Button from 'src/components/Button'
import SearchInput from './components/SearchInput'
import FilterPanel from './components/FilterPanel'
import ActiveFilterChips from './components/ActiveFilterChips'
import { useFilterState } from './useFilterState'

export interface OrderSearchFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  dateRange: { from: string; to: string } | null
  onDateRangeChange: (range: { from: string; to: string } | null) => void
  priceRange: { min: number; max: number } | null
  onPriceRangeChange: (range: { min: number; max: number } | null) => void
  onClearAll: () => void
  activeFilterCount: number
  totalResults?: number
  className?: string
}

export default function OrderSearchFilter(props: OrderSearchFilterProps) {
  const { totalResults, className, searchQuery, dateRange, priceRange } = props
  const reducedMotion = useReducedMotion()

  const {
    inputValue,
    isFilterPanelOpen,
    dateFrom,
    dateTo,
    priceMin,
    priceMax,
    hasSearchFilter,
    hasDateFilter,
    hasPriceFilter,
    hasAnyFilter,
    handleInputChange,
    handleClearSearch,
    handleDateFromChange,
    handleDateToChange,
    handleClearDateRange,
    handlePriceMinChange,
    handlePriceMaxChange,
    handleClearPriceRange,
    handleClearAllFilters,
    toggleFilterPanel
  } = useFilterState(props)

  return (
    <div className={classNames('rounded-xs bg-white p-4 shadow-xs dark:bg-slate-800', className)}>
      <div className='flex flex-col gap-3 sm:flex-row'>
        <SearchInput inputValue={inputValue} onInputChange={handleInputChange} onClearSearch={handleClearSearch} />

        <Button
          animated={false}
          type='button'
          onClick={toggleFilterPanel}
          className={classNames(
            'relative flex items-center gap-2 rounded-xs border px-4 py-2.5 text-sm font-medium transition-colors',
            {
              'border-[#ee4d2d] bg-[#ee4d2d]/5 text-[#ee4d2d] dark:bg-[#ee4d2d]/10': isFilterPanelOpen || hasAnyFilter,
              'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-slate-600 dark:text-gray-300 dark:hover:border-slate-500':
                !isFilterPanelOpen && !hasAnyFilter
            }
          )}
          aria-expanded={isFilterPanelOpen}
          aria-label='Mở bộ lọc nâng cao'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5'
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75'
            />
          </svg>
          <span>Bộ lọc</span>
          {props.activeFilterCount > 0 && (
            <span className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ee4d2d] text-xs font-bold text-white'>
              {props.activeFilterCount}
            </span>
          )}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={2}
            stroke='currentColor'
            className={classNames('h-4 w-4 transition-transform', {
              'rotate-180': isFilterPanelOpen
            })}
            aria-hidden='true'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5' />
          </svg>
        </Button>
      </div>

      <FilterPanel
        isOpen={isFilterPanelOpen}
        reducedMotion={reducedMotion}
        dateFrom={dateFrom}
        dateTo={dateTo}
        priceMin={priceMin}
        priceMax={priceMax}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onPriceMinChange={handlePriceMinChange}
        onPriceMaxChange={handlePriceMaxChange}
      />

      <ActiveFilterChips
        reducedMotion={reducedMotion}
        totalResults={totalResults}
        searchQuery={searchQuery}
        dateRange={dateRange}
        priceRange={priceRange}
        hasSearchFilter={hasSearchFilter}
        hasDateFilter={hasDateFilter}
        hasPriceFilter={hasPriceFilter}
        hasAnyFilter={hasAnyFilter}
        onClearSearch={handleClearSearch}
        onClearDateRange={handleClearDateRange}
        onClearPriceRange={handleClearPriceRange}
        onClearAllFilters={handleClearAllFilters}
      />
    </div>
  )
}
