import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { EyeIcon, FireIcon } from 'src/components/Icons'

interface ViewerCountBadgeProps {
  viewerCount: number
  isPopular: boolean
  className?: string
}

export default function ViewerCountBadge({
  viewerCount,
  isPopular,
  className,
}: ViewerCountBadgeProps) {
  const { t } = useTranslation('product')

  if (viewerCount <= 1) {
    return null
  }

  return (
    <div
      className={classNames(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
        {
          'animate-pulse motion-reduce:animate-none bg-orange/10 text-orange': isPopular,
          'bg-gray-100 text-gray-600': !isPopular,
        },
        className,
      )}
    >
      <EyeIcon className="h-3.5 w-3.5" />
      {isPopular ? (
        <span className="inline-flex items-center gap-0.5 font-medium">
          <FireIcon className="h-3.5 w-3.5" /> {t('viewer.popular')}
        </span>
      ) : (
        <span>{t('viewer.watching', { count: viewerCount })}</span>
      )}
    </div>
  )
}
