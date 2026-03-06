interface Props {
  suggestion: string
  searchValue: string
  onSelect: () => void
}

const SearchSuggestionItem = ({ suggestion, searchValue, onSelect }: Props) => {
  // Highlight từ khóa tìm kiếm trong suggestion
  const highlightSearchValue = (text: string, searchValue: string) => {
    if (!searchValue) return text

    const regex = new RegExp(`(${searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className='font-medium text-orange'>
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  return (
    <div
      className='-mx-2 flex cursor-pointer items-center rounded-sm px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700'
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
          d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
        />
      </svg>
      <span className='flex-1 text-xs leading-tight text-gray-700 md:text-sm dark:text-gray-100'>
        {highlightSearchValue(suggestion, searchValue)}
      </span>
    </div>
  )
}

export default SearchSuggestionItem
