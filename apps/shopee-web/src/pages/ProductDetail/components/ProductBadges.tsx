import { useTranslation } from 'react-i18next'

const ProductBadges = () => {
  const { t } = useTranslation('product')

  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-sm bg-orange px-1.5 py-0.5 text-xs font-medium text-white">
        <svg aria-hidden="true" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {t('badges.favorite')}
      </span>
    </div>
  )
}

export default ProductBadges
