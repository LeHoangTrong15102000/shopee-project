import Button from 'src/components/Button'

interface SearchInputProps {
  inputValue: string
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
}

export default function SearchInput({ inputValue, onInputChange, onClearSearch }: SearchInputProps) {
  return (
    <div className='relative flex-1'>
      <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='h-5 w-5 text-gray-400 dark:text-gray-500'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
          />
        </svg>
      </div>
      <input
        type='text'
        value={inputValue}
        onChange={onInputChange}
        placeholder='Tìm kiếm đơn hàng theo tên sản phẩm...'
        className='w-full rounded-xs border border-gray-300 bg-gray-50 py-2.5 pr-10 pl-10 text-sm text-gray-900 transition-colors focus:border-[#ee4d2d] focus:bg-white focus:ring-1 focus:ring-[#ee4d2d] focus:outline-hidden dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100 dark:focus:bg-slate-800'
        aria-label='Tìm kiếm đơn hàng'
      />
      {inputValue && (
        <Button
          variant='text'
          animated={false}
          type='button'
          onClick={onClearSearch}
          className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          aria-label='Xóa tìm kiếm'
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
            <path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' />
          </svg>
        </Button>
      )}
    </div>
  )
}
