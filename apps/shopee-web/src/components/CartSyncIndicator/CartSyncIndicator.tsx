import classNames from 'classnames'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CartSyncIndicatorProps {
  isSyncing: boolean
  lastSyncTimestamp: string | null
  className?: string
}

export default function CartSyncIndicator({ isSyncing, lastSyncTimestamp, className }: CartSyncIndicatorProps) {
  const { t } = useTranslation('cart')
  const [showSynced, setShowSynced] = useState(false)
  const [prevTimestamp, setPrevTimestamp] = useState<string | null>(null)

  useEffect(() => {
    if (lastSyncTimestamp && lastSyncTimestamp !== prevTimestamp && !isSyncing) {
      setShowSynced(true)
      setPrevTimestamp(lastSyncTimestamp)

      const timer = setTimeout(() => {
        setShowSynced(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [lastSyncTimestamp, prevTimestamp, isSyncing])

  if (isSyncing) {
    return (
      <div
        className={classNames(
          'inline-flex animate-pulse items-center gap-1 text-xs text-gray-500 dark:text-gray-400',
          className
        )}
      >
        <span>🔄</span>
        <span>{t('sync.syncing')}</span>
      </div>
    )
  }

  if (showSynced) {
    return (
      <div className={classNames('inline-flex animate-fade-in items-center gap-1 text-xs text-green-600', className)}>
        <span>✓</span>
        <span>{t('sync.synced')}</span>
      </div>
    )
  }

  return null
}
