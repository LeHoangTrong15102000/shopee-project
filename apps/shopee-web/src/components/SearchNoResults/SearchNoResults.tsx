import { memo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import Button from 'src/components/Button'

interface SearchNoResultsProps {
  searchTerm: string
  onPopularSearch?: (term: string) => void
}

const popularSearchTerms = [
  'Điện thoại',
  'Áo thun nam',
  'Laptop',
  'Tai nghe bluetooth',
  'Giày sneaker',
  'Túi xách nữ',
  'Đồng hồ',
  'Mỹ phẩm'
]

const SearchNoResults = memo(function SearchNoResults({ searchTerm, onPopularSearch }: SearchNoResultsProps) {
  const { t } = useTranslation('home')
  const prefersReducedMotion = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }
    }
  }

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            staggerChildren: 0.05,
            delayChildren: 0.2
          }
    }
  }

  const listItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }
    }
  }

  return (
    <motion.div className='px-4 py-12 text-center' variants={containerVariants} initial='hidden' animate='visible'>
      {/* Icon */}
      <motion.div className='mx-auto mb-6 h-24 w-24' variants={itemVariants}>
        <svg
          className='h-full w-full text-gray-300 dark:text-gray-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      </motion.div>

      {/* Main message */}
      <motion.h3 className='mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300' variants={itemVariants}>
        {t('search.noResultsFor', { term: searchTerm })}
      </motion.h3>

      {/* Suggestions section */}
      <motion.div className='mx-auto mt-6 max-w-md' variants={listVariants}>
        <p className='mb-3 font-medium text-gray-600 dark:text-gray-300'>{t('search.suggestion.tryThis')}</p>
        <ul className='mb-6 space-y-2 text-left text-gray-500 dark:text-gray-400'>
          <motion.li className='flex items-center gap-2' variants={listItemVariants}>
            <svg
              className='h-4 w-4 shrink-0 text-[#ee4d2d] dark:text-orange-400'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            <span>{t('search.suggestion.checkSpelling')}</span>
          </motion.li>
          <motion.li className='flex items-center gap-2' variants={listItemVariants}>
            <svg
              className='h-4 w-4 shrink-0 text-[#ee4d2d] dark:text-orange-400'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            <span>{t('search.suggestion.shorterKeywords')}</span>
          </motion.li>
          <motion.li className='flex items-center gap-2' variants={listItemVariants}>
            <svg
              className='h-4 w-4 shrink-0 text-[#ee4d2d] dark:text-orange-400'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            <span>{t('search.suggestion.popularKeywords')}</span>
          </motion.li>
        </ul>
      </motion.div>

      {/* Popular search terms */}
      <motion.div className='mt-8' variants={listVariants}>
        <p className='mb-4 font-medium text-gray-600 dark:text-gray-300'>{t('search.popularSearches')}:</p>
        <div className='flex flex-wrap justify-center gap-2'>
          {popularSearchTerms.map((term, index) => (
            <motion.div key={term} variants={listItemVariants} custom={index}>
              <Button
                animated={false}
                onClick={() => onPopularSearch?.(term)}
                className='rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600 transition-colors duration-200 hover:bg-[#ee4d2d] hover:text-white dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-orange-500'
              >
                {term}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
})

export default SearchNoResults
