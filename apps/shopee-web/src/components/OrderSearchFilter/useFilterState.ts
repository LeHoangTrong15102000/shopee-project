import { useState, useEffect, useCallback } from 'react'
import { OrderSearchFilterProps } from './OrderSearchFilter'

export function useFilterState({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  priceRange,
  onPriceRangeChange,
  onClearAll,
  activeFilterCount
}: OrderSearchFilterProps) {
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  const [dateFrom, setDateFrom] = useState(dateRange?.from || '')
  const [dateTo, setDateTo] = useState(dateRange?.to || '')
  const [priceMin, setPriceMin] = useState(priceRange?.min?.toString() || '')
  const [priceMax, setPriceMax] = useState(priceRange?.max?.toString() || '')

  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    setDateFrom(dateRange?.from || '')
    setDateTo(dateRange?.to || '')
  }, [dateRange])

  useEffect(() => {
    setPriceMin(priceRange?.min?.toString() || '')
    setPriceMax(priceRange?.max?.toString() || '')
  }, [priceRange])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchQuery) {
        onSearchChange(inputValue)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, searchQuery, onSearchChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleClearSearch = useCallback(() => {
    setInputValue('')
    onSearchChange('')
  }, [onSearchChange])

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = e.target.value
    setDateFrom(newFrom)
    if (newFrom && dateTo) {
      onDateRangeChange({ from: newFrom, to: dateTo })
    } else if (!newFrom && !dateTo) {
      onDateRangeChange(null)
    }
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = e.target.value
    setDateTo(newTo)
    if (dateFrom && newTo) {
      onDateRangeChange({ from: dateFrom, to: newTo })
    } else if (!dateFrom && !newTo) {
      onDateRangeChange(null)
    }
  }

  const handleClearDateRange = useCallback(() => {
    setDateFrom('')
    setDateTo('')
    onDateRangeChange(null)
  }, [onDateRangeChange])

  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPriceMin(value)
    const min = parseFloat(value)
    const max = parseFloat(priceMax)
    if (!isNaN(min) && !isNaN(max)) {
      onPriceRangeChange({ min, max })
    } else if (value === '' && priceMax === '') {
      onPriceRangeChange(null)
    }
  }

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPriceMax(value)
    const min = parseFloat(priceMin)
    const max = parseFloat(value)
    if (!isNaN(min) && !isNaN(max)) {
      onPriceRangeChange({ min, max })
    } else if (priceMin === '' && value === '') {
      onPriceRangeChange(null)
    }
  }

  const handleClearPriceRange = useCallback(() => {
    setPriceMin('')
    setPriceMax('')
    onPriceRangeChange(null)
  }, [onPriceRangeChange])

  const handleClearAllFilters = useCallback(() => {
    setInputValue('')
    setDateFrom('')
    setDateTo('')
    setPriceMin('')
    setPriceMax('')
    onClearAll()
  }, [onClearAll])

  const toggleFilterPanel = () => {
    setIsFilterPanelOpen((prev) => !prev)
  }

  const hasSearchFilter = searchQuery.trim().length > 0
  const hasDateFilter = dateRange !== null
  const hasPriceFilter = priceRange !== null
  const hasAnyFilter = activeFilterCount > 0

  return {
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
  }
}
