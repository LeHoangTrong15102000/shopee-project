import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { purchasesStatus } from 'src/constant/purchase'
import Button from 'src/components/Button'

interface PurchaseTabBarProps {
  status: number
  onStatusChange: (status: number) => void
}

const purchaseTabs = [
  { status: purchasesStatus.all, nameKey: 'history.all' },
  { status: purchasesStatus.waitForConfirmation, nameKey: 'history.pendingConfirmation' },
  { status: purchasesStatus.waitForGetting, nameKey: 'history.pendingPickup' },
  { status: purchasesStatus.inProgress, nameKey: 'history.inDelivery' },
  { status: purchasesStatus.delivered, nameKey: 'history.completed' },
  { status: purchasesStatus.cancelled, nameKey: 'history.cancelled' }
]

const PurchaseTabBar = ({ status, onStatusChange }: PurchaseTabBarProps) => {
  const { t } = useTranslation('user')
  return (
    <div className='sticky top-0 z-20 scrollbar-hide flex items-center overflow-x-auto rounded-t-sm bg-white shadow-xs dark:bg-slate-800'>
      {purchaseTabs.map((tab) => (
        <Button
          animated={false}
          key={tab.status}
          onClick={() => onStatusChange(tab.status)}
          className={classNames(
            'flex min-w-20 items-center justify-center bg-white px-3 py-3 text-center text-xs whitespace-nowrap transition-all hover:text-orange sm:min-w-0 sm:flex-1 sm:px-4 sm:py-4 sm:text-sm dark:bg-slate-800 dark:hover:text-orange-400',
            {
              'border-b-2 border-b-orange font-medium text-orange dark:border-b-orange-400 dark:text-orange-400':
                status === tab.status,
              'border-b-2 border-b-gray-200 text-gray-900 dark:border-b-slate-600 dark:text-gray-100':
                status !== tab.status
            }
          )}
        >
          {t(tab.nameKey as never)}
        </Button>
      ))}
    </div>
  )
}

export default PurchaseTabBar
