import { useTranslation } from 'react-i18next'
import { Badge } from 'src/components/ui/badge'
import { cn } from 'src/lib/utils'

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const statusColorMap: Record<string, { className: string; variant: StatusVariant }> = {
  active: {
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    variant: 'outline',
  },
  enabled: {
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    variant: 'outline',
  },
  inactive: {
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    variant: 'outline',
  },
  disabled: {
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    variant: 'outline',
  },
  pending: {
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    variant: 'outline',
  },
  processing: {
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    variant: 'outline',
  },
  shipped: {
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    variant: 'outline',
  },
  delivered: {
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    variant: 'outline',
  },
  cancelled: {
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    variant: 'outline',
  },
  approved: {
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    variant: 'outline',
  },
  flagged: {
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    variant: 'outline',
  },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation('common')
  const config = statusColorMap[status.toLowerCase()] ?? {
    className: '',
    variant: 'secondary' as StatusVariant,
  }

  const key = `statuses.${status.toLowerCase()}`
  const translated = t(key)
  const label = translated !== key ? translated : status

  return (
    <Badge
      variant={config.variant}
      className={cn('border-transparent capitalize', config.className, className)}
    >
      {label}
    </Badge>
  )
}
