import { useTranslation } from 'react-i18next'
import Popover from 'src/components/Popover'
import { ChevronRightIcon, ShieldIcon, ShieldCheckIcon } from 'src/components/Icons'
import ShopeeProtectionPopupContent from './ShopeeProtectionPopupContent'

const ShopeeProtection = () => {
  const { t } = useTranslation('product')

  return (
    <Popover
      placement="bottom-start"
      enableArrow={true}
      renderPopover={<ShopeeProtectionPopupContent />}
      role="button"
      tabIndex={0}
      popoverLabel={t('protection.modalTitle')}
      ariaLabel={t('protection.shopeeGuarantee')}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
    >
      <div className="flex cursor-pointer items-center gap-3 border-t border-gray-100 py-4 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/50">
        <span className="w-28 shrink-0 text-sm text-gray-500 dark:text-gray-400">
          {t('protection.shopeeGuarantee')}
        </span>
        <div className="flex flex-1 items-center gap-2">
          {/* Shield icon + Free Return */}
          <ShieldIcon className="h-4 w-4 shrink-0 text-orange dark:text-orange-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t('protection.freeReturn')}
          </span>
          {/* Separator */}
          <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">
            |
          </span>
          {/* Checkmark icon + Authentic */}
          <ShieldCheckIcon className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t('protection.authenticity.title')}
          </span>
        </div>
        {/* Chevron icon */}
        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
      </div>
    </Popover>
  )
}

export default ShopeeProtection
