import classNames from 'classnames'
import { useForm, Controller } from 'react-hook-form'
import { Link, createSearchParams } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from 'src/components/Button'
import InputNumber from 'src/components/InputNumber'
import path from 'src/constant/path'

import { Category } from 'src/types/category.type'
import { inputNumberSchema } from 'src/utils/rules'
import RatingStars from 'src/pages/ProductList/components/RatingStars'
import { useProductQueryStates } from 'src/hooks/nuqs'
import { useTranslation } from 'react-i18next'

interface Props {
  categories: Category[]
}

type FormData = z.infer<typeof inputNumberSchema>

const AsideFilter = ({ categories }: Props) => {
  const { t } = useTranslation('home')
  const [filters, setFilters] = useProductQueryStates()
  const { category } = filters

  const filtersAsStrings = Object.fromEntries(
    Object.entries(filters)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ) as Record<string, string>

  const {
    control,
    handleSubmit,
    trigger,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      price_max: '',
      price_min: ''
    },
    resolver: zodResolver(inputNumberSchema),
    shouldFocusError: false
  })

  const onSubmit = handleSubmit(
    (data) => {
      setFilters({
        price_max: data.price_max ? Number(data.price_max) : null,
        price_min: data.price_min ? Number(data.price_min) : null
      })
    },
    (err) => {
      console.log(err)
    }
  )

  const handleRemoveAsideFilter = () => {
    reset()
    setFilters({ price_min: null, price_max: null, category: null, rating_filter: null })
  }

  return (
    <div
      className='rounded-xs bg-white px-3 py-4 text-black/80 shadow-xs dark:bg-slate-800 dark:text-gray-200 dark:shadow-slate-900/20'
      role='navigation'
      aria-label='Bộ lọc sản phẩm'
    >
      {/* Tất cả danh mục */}
      <Link
        to={path.products}
        className={classNames('flex items-center font-bold', {
          'text-orange dark:text-orange-400': !category // active khi không có query category
        })}
      >
        <svg viewBox='0 0 12 10' className='mr-2 h-4 w-3 fill-current'>
          <g fillRule='evenodd' stroke='none' strokeWidth={1}>
            <g transform='translate(-373 -208)'>
              <g transform='translate(155 191)'>
                <g transform='translate(218 17)'>
                  <path d='m0 2h2v-2h-2zm4 0h7.1519633v-2h-7.1519633z' />
                  <path d='m0 6h2v-2h-2zm4 0h7.1519633v-2h-7.1519633z' />
                  <path d='m0 10h2v-2h-2zm4 0h7.1519633v-2h-7.1519633z' />
                </g>
              </g>
            </g>
          </g>
        </svg>
        <span className='capitalize'>{t('aside filter.all categories')}</span>
      </Link>
      <div className='my-4 h-px bg-gray-300 dark:bg-slate-600'></div>
      <ul>
        {categories.map((categoryItem) => {
          const isActive = category === categoryItem._id
          return (
            <li className='py-2 pl-2' key={categoryItem._id}>
              <Link
                to={{
                  pathname: path.products,
                  search: createSearchParams({
                    ...filtersAsStrings,
                    category: categoryItem._id
                  }).toString()
                }}
                className={classNames('relative px-2', {
                  'font-semibold text-orange dark:text-orange-400': isActive
                })}
              >
                {isActive && (
                  <svg
                    viewBox='0 0 4 7'
                    className='absolute top-1 left-[-5px] mr-3 h-2 w-2 fill-orange dark:fill-orange-400'
                  >
                    <polygon points='4 3.5 0 0 0 7' />
                  </svg>
                )}
                {categoryItem.name}
              </Link>
            </li>
          )
        })}
        {/* <li className='py-2 pl-2'>
          <Link to={path.home} className='relative px-2'>
            Điện thoại
          </Link>
        </li> */}
      </ul>
      {/* Bộ lọc tìm kiếm */}
      <Link to={path.products} className='mt-4 flex items-center font-bold uppercase'>
        <svg
          enableBackground='new 0 0 15 15'
          viewBox='0 0 15 15'
          x={0}
          y={0}
          className='mr-3 h-4 w-3 fill-current stroke-current'
        >
          <g>
            <polyline
              fill='none'
              points='5.5 13.2 5.5 5.8 1.5 1.2 13.5 1.2 9.5 5.8 9.5 10.2'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeMiterlimit={10}
            />
          </g>
        </svg>
        <span className=''>{t('aside filter.search filter')}</span>
      </Link>
      <div className='my-4 h-px bg-gray-300 dark:bg-slate-600'></div>
      {/* Filter theo khoảng giá */}
      <div className='my-4'>
        <div className='capitalize dark:text-gray-200'>{t('filter.priceRange')}</div>
        <form className='mt-2' onSubmit={onSubmit}>
          <div className='flex items-start'>
            <Controller
              control={control}
              name='price_min'
              render={({ field }) => {
                return (
                  <InputNumber
                    type='text'
                    className='grow'
                    classNameError='hidden'
                    placeholder={t('filter.fromPlaceholder')}
                    classNameInput='px-2 py-2 md:px-1 md:py-1 text-sm w-full outline-hidden border rounded-xs border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:shadow-xs'
                    // onChange={(event) => field.onChange(event)} // onChange trong field có nhận vào cái event
                    {...field}
                    onChange={(event) => {
                      field.onChange(event)
                      trigger('price_max')
                    }} // có thể viết gọn lại như này
                    /**
                     *  Nó vẫn sẽ hiểu là có hai thằng này trong thẻ Input
                     *  // value={field.value}
                        // ref={field.ref}
                     */
                  />
                )
              }}
            />
            {/* shrink-0 cho nó đừng có bị co lại */}
            <div className='mx-2.5 shrink-0 text-[#bdbdbd] dark:text-gray-500'>--</div>
            {/* <InputV2
              control={control}
              name='price_max'
              type='number'
              className='grow'
              classNameError='hidden'
              placeholder='₫ ĐẾN'
              classNameInput='px-1 py-1 text-sm w-full outline-hidden border rounded-xs border-gray-300 focus:border-gray-500 focus:shadow-xs'
              maxValue={'50000000'}
              onChange={() => {
                trigger('price_min')
              }}
            /> */}
            <Controller
              control={control}
              name='price_max'
              render={({ field }) => {
                return (
                  <InputNumber
                    type='text'
                    className='grow'
                    classNameError='hidden'
                    placeholder={t('filter.toPlaceholder')}
                    classNameInput='px-2 py-2 md:px-1 md:py-1 text-sm w-full outline-hidden border rounded-xs border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:shadow-xs'
                    maxValue={'50000000'}
                    {...field}
                    onChange={(event) => {
                      field.onChange(event)
                      trigger('price_min')
                    }}
                  />
                )
              }}
            />
          </div>
          <div className='mt-1 min-h-5 text-center text-sm text-red-600 dark:text-red-400'>
            {errors.price_min?.message}
          </div>
          <Button
            variant='primary'
            aria-label={t('filter.apply')}
            className='flex w-full items-center justify-center p-2 text-sm uppercase dark:bg-orange-500 dark:hover:bg-orange-400'
          >
            {t('filter.apply')}
          </Button>
          <div className='my-4 h-px bg-gray-300 dark:bg-slate-600'></div>
        </form>
        {/* Đánh giá */}
        <div className='my-4'>
          <div className='capitalize dark:text-gray-200'>{t('filter.rating')}</div>
        </div>
      </div>
      {/* Sao đánh giá sản phẩm */}
      <RatingStars />
      {/* Button Xóa tất cả filter */}
      <div className='my-4 h-px bg-gray-300 dark:bg-slate-600'></div>
      <Button
        variant='primary'
        onClick={handleRemoveAsideFilter}
        aria-label={t('filter.clearAll')}
        className='flex w-full items-center justify-center p-2 text-sm uppercase dark:bg-orange-500 dark:hover:bg-orange-400'
      >
        {t('filter.clearAll')}
      </Button>
    </div>
  )
}

export default AsideFilter
