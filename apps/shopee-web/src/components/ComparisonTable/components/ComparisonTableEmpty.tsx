import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import path from 'src/constant/path'

interface ComparisonTableEmptyProps {
  className?: string
}

export default function ComparisonTableEmpty({ className }: ComparisonTableEmptyProps) {
  const { t } = useTranslation('compare')
  return (
    <div className={classNames('py-12 text-center', className)} role='region' aria-label={t('tableAriaLabel')}>
      <svg
        className='mx-auto h-16 w-16 text-gray-400 dark:text-gray-500'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        aria-hidden='true'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        />
      </svg>
      <p className='mt-4 text-gray-500 dark:text-gray-400' aria-live='polite'>
        {t('emptyState')}
      </p>
      <Link to={path.home} className='mt-4 inline-block text-orange hover:underline'>
        {t('addToCompare')}
      </Link>
    </div>
  )
}
