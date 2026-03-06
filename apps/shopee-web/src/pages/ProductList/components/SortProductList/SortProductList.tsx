import classNames from 'classnames'
import { Link, createSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import path from 'src/constant/path'
import { sortBy, order as orderConstant } from 'src/constant/product'
import { useProductQueryStates } from 'src/hooks/nuqs'
import ViewToggle, { ViewMode } from 'src/components/ViewToggle'
import Button from 'src/components/Button'

import { ProductListConfig } from 'src/types/product.type'

interface Props {
  pageSize: number
  viewMode?: ViewMode
  onViewChange?: (mode: ViewMode) => void
}

const SortProductList = ({ pageSize, viewMode, onViewChange }: Props) => {
  const { t } = useTranslation('home')
  const [filters, setFilters] = useProductQueryStates()
  const page = filters.page
  const { sort_by, order } = filters

  const filtersAsStrings = Object.fromEntries(
    Object.entries(filters)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ) as Record<string, string>

  const isActiveSortBy = (sortByValue: Exclude<ProductListConfig['sort_by'], undefined>) => {
    return sort_by === sortByValue
  }

  const handleSortNavigate = (sortByValue: Exclude<ProductListConfig['sort_by'], undefined>) => {
    setFilters({ sort_by: sortByValue, order: null })
  }

  const handlePriceOrder = (orderValue: Exclude<ProductListConfig['order'], undefined>) => {
    setFilters({ sort_by: 'price' as const, order: orderValue })
  }

  return (
    <div className='bg-gray-300/40 px-3 py-4 dark:bg-slate-700/40'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        {/* sort theo tên: phổ biến - mới nhất - bán chạy */}
        <div className='flex flex-wrap items-center gap-2'>
          <div className='text-sm text-[rgba(0,0,0,.7)] dark:text-gray-300'>{t('sort.sortBy')}</div>
          <Button
            variant='ghost'
            animated={false}
            className={classNames('capitaliz h-10 rounded-xs px-4 text-center text-sm md:h-8', {
              'bg-orange text-white hover:bg-orange': isActiveSortBy(sortBy.view),
              'bg-white text-black/80 hover:bg-slate-100 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700':
                !isActiveSortBy(sortBy.view)
            })}
            onClick={() => handleSortNavigate(sortBy.view)}
          >
            {t('sort.popular')}
          </Button>
          <Button
            variant='ghost'
            animated={false}
            className={classNames('capitaliz h-10 rounded-xs px-4 text-center text-sm md:h-8', {
              'bg-orange text-white hover:bg-orange': isActiveSortBy(sortBy.createdAt),
              'bg-white text-black/80 hover:bg-slate-100 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700':
                !isActiveSortBy(sortBy.createdAt)
            })}
            onClick={() => handleSortNavigate(sortBy.createdAt)}
          >
            {t('sort.latest')}
          </Button>
          <Button
            variant='ghost'
            animated={false}
            className={classNames('capitaliz h-10 rounded-xs px-4 text-center text-sm md:h-8', {
              'bg-orange text-white hover:bg-orange': isActiveSortBy(sortBy.sold),
              'bg-white text-black/80 hover:bg-slate-100 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700':
                !isActiveSortBy(sortBy.sold)
            })}
            onClick={() => handleSortNavigate(sortBy.sold)}
          >
            {t('sort.bestSelling')}
          </Button>
          {/* sort productList */}
          <select
            aria-label={t('sort.sortBy')}
            className={classNames('h-10 px-4 text-left text-sm capitalize outline-hidden md:h-8', {
              'bg-white/70 text-orange hover:bg-slate-100 dark:bg-slate-700/70 dark:hover:bg-slate-700': isActiveSortBy(
                sortBy.price
              ),
              'bg-white text-black/80 hover:bg-slate-100 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700':
                !isActiveSortBy(sortBy.price)
            })}
            value={order || ''}
            onChange={(event) => handlePriceOrder(event.target.value as Exclude<ProductListConfig['order'], undefined>)}
          >
            <option value='' className='bg-white text-black/80 dark:bg-slate-800 dark:text-gray-200' disabled>
              {t('sort.price')}
            </option>
            <option value={orderConstant.asc} className='bg-white text-black/80 dark:bg-slate-800 dark:text-gray-200'>
              {t('sort.priceLowToHigh')}
            </option>
            <option value={orderConstant.desc} className='bg-white text-black/80 dark:bg-slate-800 dark:text-gray-200'>
              {t('sort.priceHighToLow')}
            </option>
          </select>
        </div>
        {/* tăng giảm số trang hiện tại */}
        <div className='flex items-center gap-4'>
          {/* View Toggle */}
          {viewMode && onViewChange && <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />}

          <div className='text-sm dark:text-gray-300'>
            <span className='text-orange dark:text-orange-400'>{page}</span>
            <span>/{pageSize}</span>
          </div>
          <div className='ml-6 flex items-center'>
            {page === 1 ? (
              <span className='flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-tl-sm rounded-bl-sm bg-white/40 opacity-50 shadow-sm hover:bg-slate-100 md:h-8 md:w-9 dark:bg-slate-700/40 dark:shadow-slate-900/20 dark:hover:bg-slate-700'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='h-4 w-4 dark:text-gray-400'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
                </svg>
              </span>
            ) : (
              <Link
                to={{
                  pathname: path.products,
                  search: createSearchParams({
                    ...filtersAsStrings,
                    page: String(page - 1)
                  }).toString()
                }}
                className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-tl-sm rounded-bl-sm bg-white/40 shadow-sm hover:bg-slate-100 md:h-8 md:w-9 dark:bg-slate-700/40 dark:shadow-slate-900/20 dark:hover:bg-slate-700'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='h-4 w-4 dark:text-gray-300'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
                </svg>
              </Link>
            )}
            {page === pageSize ? (
              <span className='flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-tl-sm rounded-bl-sm bg-white/40 opacity-50 shadow-sm hover:bg-slate-100 md:h-8 md:w-9 dark:bg-slate-700/40 dark:shadow-slate-900/20 dark:hover:bg-slate-700'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='h-4 w-4 dark:text-gray-400'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
                </svg>
              </span>
            ) : (
              <Link
                to={{
                  pathname: path.products,
                  search: createSearchParams({
                    ...filtersAsStrings,
                    page: String(page + 1)
                  }).toString()
                }}
                className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-tl-sm rounded-bl-sm bg-white/40 shadow-sm hover:bg-slate-100 md:h-8 md:w-9 dark:bg-slate-700/40 dark:shadow-slate-900/20 dark:hover:bg-slate-700'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='h-4 w-4 dark:text-gray-300'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
                </svg>
              </Link>
            )}
            {/* <button className='h-8 rounded-tr-sm rounded-br-sm bg-white px-3 shadow-sm hover:bg-slate-100'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='h-4 w-4'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
              </svg>
            </button> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SortProductList
