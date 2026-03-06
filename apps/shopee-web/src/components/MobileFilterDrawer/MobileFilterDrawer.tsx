import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { Link, createSearchParams } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import classNames from 'classnames'

import Button from 'src/components/Button'
import InputNumber from 'src/components/InputNumber'
import RatingStars from 'src/pages/ProductList/components/RatingStars'
import path from 'src/constant/path'
import { useProductQueryStates } from 'src/hooks/nuqs'
import { useFocusTrap } from 'src/hooks/useFocusTrap'
import { Category } from 'src/types/category.type'
import { inputNumberSchema } from 'src/utils/rules'
import { useTranslation } from 'react-i18next'

interface MobileFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
}

type FormData = z.infer<typeof inputNumberSchema>

const MobileFilterDrawer = ({ isOpen, onClose, categories }: MobileFilterDrawerProps) => {
  const { t } = useTranslation('home')
  const [filters, setFilters] = useProductQueryStates()
  const { category } = filters
  const drawerRef = useRef<HTMLDivElement>(null)

  useFocusTrap({ isOpen, containerRef: drawerRef, onClose })

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const onSubmit = handleSubmit((data) => {
    setFilters({ price_max: Number(data.price_max), price_min: Number(data.price_min) })
    onClose()
  })

  const handleRemoveAsideFilter = () => {
    reset()
    setFilters({ price_min: null, price_max: null, category: null, rating_filter: null })
    onClose()
  }

  const handleCategoryClick = () => {
    onClose()
  }

  const filtersAsStrings = Object.fromEntries(
    Object.entries(filters)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ) as Record<string, string>

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-9998 bg-black md:hidden'
            onClick={onClose}
            aria-label='Close filter drawer'
          />
          <motion.div
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className='fixed top-0 left-0 z-9999 h-full w-[280px] overflow-y-auto rounded-r-xl bg-white shadow-lg md:hidden dark:bg-slate-800'
            role='dialog'
            aria-modal='true'
            aria-label='Filter drawer'
          >
            <div className='sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-800'>
              <h2 className='text-lg font-semibold dark:text-gray-100'>{t('aside filter.search filter')}</h2>
              <Button
                variant='icon'
                animated={false}
                onClick={onClose}
                className='p-1 hover:bg-gray-100 dark:hover:bg-slate-700'
                aria-label='Close filter drawer'
              >
                <svg className='h-6 w-6 dark:text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </Button>
            </div>
            <div className='p-4 text-[rgba(0,0,0,.8)] dark:text-gray-200'>
              <Link
                to={path.products}
                onClick={handleCategoryClick}
                className={classNames('flex items-center font-bold', {
                  'text-orange dark:text-orange-400': !category
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
              <div className='my-4 h-px bg-gray-300 dark:bg-slate-600' />
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
                        onClick={handleCategoryClick}
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
              </ul>
              <Link to={path.products} className='mt-4 flex items-center font-bold uppercase dark:text-gray-100'>
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
                <span>{t('aside filter.search filter')}</span>
              </Link>
              <div className='my-4 h-px bg-gray-300 dark:bg-slate-600' />
              <div className='my-4'>
                <div className='capitalize dark:text-gray-200'>{t('filter.priceRange')}</div>
                <form className='mt-2' onSubmit={onSubmit}>
                  <div className='flex items-start'>
                    <Controller
                      control={control}
                      name='price_min'
                      render={({ field }) => (
                        <InputNumber
                          type='text'
                          className='grow'
                          classNameError='hidden'
                          placeholder={t('filter.fromPlaceholder')}
                          classNameInput='px-1 py-1 text-sm w-full outline-hidden border rounded-xs border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:shadow-xs'
                          {...field}
                          onChange={(event) => {
                            field.onChange(event)
                            trigger('price_max')
                          }}
                        />
                      )}
                    />
                    <div className='mx-2.5 shrink-0 text-[#bdbdbd] dark:text-gray-500'>--</div>
                    <Controller
                      control={control}
                      name='price_max'
                      render={({ field }) => (
                        <InputNumber
                          type='text'
                          className='grow'
                          classNameError='hidden'
                          placeholder={t('filter.toPlaceholder')}
                          classNameInput='px-1 py-1 text-sm w-full outline-hidden border rounded-xs border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:shadow-xs'
                          maxValue='50000000'
                          {...field}
                          onChange={(event) => {
                            field.onChange(event)
                            trigger('price_min')
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className='mt-1 min-h-5 text-center text-sm text-red-600 dark:text-red-400'>
                    {errors.price_min?.message}
                  </div>
                  <Button
                    variant='primary'
                    className='flex w-full items-center justify-center p-2 text-sm uppercase dark:bg-orange-500 dark:hover:bg-orange-400'
                  >
                    {t('filter.apply')}
                  </Button>
                  <div className='my-4 h-px bg-gray-300 dark:bg-slate-600' />
                </form>
                <div className='my-4'>
                  <div className='capitalize dark:text-gray-200'>{t('filter.rating')}</div>
                </div>
              </div>
              <RatingStars />
              <div className='my-4 h-px bg-gray-300 dark:bg-slate-600' />
              <Button
                variant='primary'
                onClick={handleRemoveAsideFilter}
                className='flex w-full items-center justify-center p-2 text-sm uppercase dark:bg-orange-500 dark:hover:bg-orange-400'
              >
                {t('filter.clearAll')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(drawerContent, document.body)
}

export default MobileFilterDrawer
