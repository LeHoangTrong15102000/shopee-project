// Sử dụng thuật toán range 2 để tạo ra pagination cho app

import classNames from 'classnames'
import { Link, createSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import path from 'src/constant/path'
import { useProductQueryStates } from 'src/hooks/nuqs'

interface Props {
  pageSize?: number
  basePath?: string
}

const RANGE = 2
const Pagination = ({ pageSize = 20, basePath = path.home }: Props) => {
  const { t } = useTranslation('common')
  const [filters] = useProductQueryStates()

  const filtersAsStrings = Object.fromEntries(
    Object.entries(filters)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ) as Record<string, string>

  const page = filters.page
  const safePage = page > 0 ? page : 1
  const safePageSize = pageSize && pageSize > 0 ? pageSize : 20

  // Viết function handle việc paginate cho trang sẽ được thực hiện ở đây
  const renderPagination = () => {
    let dotAfter = false
    let dotBefore = false
    const renderDotBefore = (index: number) => {
      if (!dotBefore) {
        dotBefore = true
        return (
          <span
            className='flex items-center justify-center border border-gray-200 bg-white px-2 py-2 text-sm shadow-xs md:px-3 md:py-3 md:text-base dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300'
            key={index}
          >
            ...
          </span>
        )
      }
      return null
    }
    const renderDotAfter = (index: number) => {
      if (!dotAfter) {
        dotAfter = true
        return (
          <span
            className='flex items-center justify-center border border-gray-200 bg-white px-2 py-2 text-sm shadow-xs md:px-3 md:py-3 md:text-base dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300'
            key={index}
          >
            ...
          </span>
        )
      }
      return null
    }
    return Array(safePageSize)
      .fill(0)
      .map((_, index) => {
        const pageNumber = index + 1
        // Trường hợp đầu tiênm, điều kiện để return về ...
        if (safePage <= RANGE * 2 + 1 && pageNumber > safePage + RANGE && pageNumber < safePageSize - RANGE + 1) {
          return renderDotAfter(index)
        } else if (safePage > RANGE * 2 + 1 && safePage < safePageSize - RANGE * 2) {
          if (pageNumber < safePage - RANGE && pageNumber > RANGE) {
            return renderDotBefore(index)
          } else if (pageNumber > safePage + RANGE && pageNumber < safePageSize - RANGE + 1) {
            return renderDotAfter(index)
          }
        } else if (safePage >= safePageSize - RANGE * 2 && pageNumber > RANGE && pageNumber < safePage - RANGE) {
          return renderDotBefore(index)
        }
        // Nó sẽ trả về một cái mảng chứa các JSX là các thẻ Link
        return (
          <Link
            to={{
              pathname: basePath,
              search: createSearchParams({
                ...filtersAsStrings,
                page: pageNumber.toString()
              }).toString()
            }}
            aria-label={t('pagination.page', { page: pageNumber })}
            aria-current={pageNumber === safePage ? 'page' : undefined}
            className={classNames(
              'flex cursor-pointer items-center justify-center px-2 py-2 text-sm transition-all duration-150 md:px-4 md:py-3 md:text-[18px]',
              {
                'bg-orange text-white hover:bg-orange dark:bg-orange-500': pageNumber === safePage,
                'border-transparent text-black/50 hover:scale-110 hover:text-orange active:scale-95 dark:text-gray-400 dark:hover:text-orange-400':
                  pageNumber !== safePage
              }
            )}
            key={index}
          >
            {pageNumber}
          </Link>
        )
      })
  }
  return (
    <nav
      className='mt-6 flex flex-wrap items-center justify-center'
      role='navigation'
      aria-label='Pagination Navigation'
    >
      {safePage === 1 ? (
        <span
          aria-label={t('pagination.prev')}
          aria-disabled='true'
          className='flex cursor-not-allowed items-center justify-center rounded-tl-sm rounded-bl-sm border-transparent px-2 py-2 opacity-40 transition-opacity duration-150 md:px-4 md:py-3'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5 text-[rgba(0,0,0,0.6)] dark:text-gray-500'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
          </svg>
        </span>
      ) : (
        <Link
          to={{
            pathname: basePath,
            search: createSearchParams({
              ...filtersAsStrings,
              page: (safePage - 1).toString()
            }).toString()
          }}
          className='flex cursor-pointer items-center justify-center rounded-tl-sm rounded-bl-sm border-transparent px-2 py-2 transition-all duration-150 hover:bg-black/5 active:scale-95 md:px-4 md:py-3 dark:hover:bg-white/10'
          aria-label='Go to previous page'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5 text-[rgba(0,0,0,0.6)] dark:text-gray-400'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
          </svg>
        </Link>
      )}
      {/* {page === } */}
      {renderPagination()}
      {safePage === safePageSize ? (
        <span
          aria-label={t('pagination.next')}
          aria-disabled='true'
          className='flex cursor-not-allowed items-center justify-center rounded-tr-sm rounded-br-sm border-transparent px-2 py-2 opacity-40 transition-opacity duration-150 md:px-4 md:py-3'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5 text-[rgba(0,0,0,.6)] dark:text-gray-500'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
          </svg>
        </span>
      ) : (
        <Link
          to={{
            pathname: basePath,
            search: createSearchParams({
              ...filtersAsStrings,
              page: (safePage + 1).toString()
            }).toString()
          }}
          className='flex cursor-pointer items-center justify-center rounded-tr-sm rounded-br-sm border-transparent px-2 py-2 transition-all duration-150 hover:bg-black/5 active:scale-95 md:px-4 md:py-3 dark:hover:bg-white/10'
          aria-label='Go to next page'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5 text-[rgba(0,0,0,.6)] dark:text-gray-400'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
          </svg>
        </Link>
      )}
    </nav>
  )
}

export default Pagination
