import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SearchSuggestions from '../SearchSuggestions'
import SearchHistory from 'src/components/SearchHistory'
import { useProductQueryStates } from 'src/hooks/nuqs'
import useSearchHistory from 'src/hooks/useSearchHistory'
import Button from 'src/components/Button'

interface SearchBarProps {
  filters: ReturnType<typeof useProductQueryStates>[0]
  setFilters: ReturnType<typeof useProductQueryStates>[1]
}

const SearchBar = ({ filters, setFilters }: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState<string>('')
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false)
  const [showSearchHistory, setShowSearchHistory] = useState<boolean>(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const { searchHistory, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setShowSearchHistory(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSuggestions(false)
        setShowSearchHistory(false)
        inputRef.current?.blur()
      }
    }

    if (showSuggestions || showSearchHistory) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showSuggestions, showSearchHistory])

  const handleChangeInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setSearchValue(value)
    if (value.trim()) {
      setShowSearchHistory(false)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      setShowSearchHistory(true)
    }
  }, [])

  const handleFocusInput = useCallback(() => {
    if (!searchValue.trim()) {
      setShowSearchHistory(true)
      setShowSuggestions(false)
    } else {
      setShowSuggestions(true)
      setShowSearchHistory(false)
    }
  }, [searchValue])

  const handleBlurInput = useCallback(() => {
    setTimeout(() => {
      if (!searchContainerRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false)
        setShowSearchHistory(false)
      }
    }, 150)
  }, [])

  const searchParamsName = useMemo(() => filters.name ?? '', [filters.name])

  useEffect(() => {
    if (searchParamsName) {
      setSearchValue(searchParamsName)
    }
  }, [searchParamsName])

  const handleHideSuggestions = useCallback(() => {
    setShowSuggestions(false)
    setShowSearchHistory(false)
  }, [])

  const handleSearchSubmit = useCallback(
    (searchTerm?: string) => {
      const finalSearchValue = searchTerm || searchValue.trim()

      if (!finalSearchValue) return

      addToHistory(finalSearchValue)

      if (filters.order) {
        setFilters({ name: finalSearchValue, order: null, sort_by: 'createdAt' as const })
      } else {
        setFilters({ name: finalSearchValue })
      }

      setShowSuggestions(false)
      setShowSearchHistory(false)
      inputRef.current?.blur()
    },
    [searchValue, addToHistory, filters.order, setFilters]
  )

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      setSearchValue(suggestion)
      handleSearchSubmit(suggestion)
    },
    [handleSearchSubmit]
  )

  const handleSelectHistoryItem = useCallback(
    (query: string) => {
      setSearchValue(query)
      setShowSearchHistory(false)
      handleSearchSubmit(query)
    },
    [handleSearchSubmit]
  )

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      handleSearchSubmit()
    },
    [handleSearchSubmit]
  )

  return (
    <div className='relative min-w-0 flex-1' ref={searchContainerRef}>
      <form onSubmit={handleFormSubmit}>
        <div className='flex rounded-xs bg-white p-1 dark:bg-slate-800'>
          <input
            ref={inputRef}
            id='main-search-input'
            value={searchValue}
            type='text'
            className='grow border-none bg-transparent px-2 py-2 text-xs text-[rgba(0,0,0,.95)] outline-hidden placeholder:text-gray-400 sm:px-3 sm:py-2.5 sm:text-sm dark:text-gray-100 dark:placeholder:text-gray-300'
            placeholder='Tìm kiếm sản phẩm'
            onChange={handleChangeInput}
            onFocus={handleFocusInput}
            onBlur={handleBlurInput}
          />
          <Button
            animated={false}
            type='submit'
            className='shrink-0 rounded-xs bg-[linear-gradient(-180deg,#f53d2d,#f63)] px-4 py-2 hover:opacity-90 sm:px-5 sm:py-2.5 md:px-6'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='currentColor'
              className='h-4 w-4 md:h-5 md:w-5'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z'
              />
            </svg>
          </Button>
        </div>
      </form>

      <SearchSuggestions
        searchValue={searchValue}
        isVisible={showSuggestions}
        onSelectSuggestion={handleSelectSuggestion}
        onHide={handleHideSuggestions}
      />

      {showSearchHistory && !searchValue.trim() && (
        <SearchHistory
          history={searchHistory}
          onSelect={handleSelectHistoryItem}
          onRemove={removeFromHistory}
          onClearAll={clearHistory}
        />
      )}
    </div>
  )
}

export default SearchBar
