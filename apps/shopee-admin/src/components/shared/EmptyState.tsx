import { Inbox } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/ui/button'
import { cn } from 'src/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  const { t } = useTranslation('common')
  const resolvedTitle = title ?? t('states.noData')
  const resolvedDescription = description ?? t('states.noResults')
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
      role="status"
      aria-live="polite"
    >
      <div className="mb-4 text-muted-foreground">{icon ?? <Inbox className="size-12" />}</div>
      <p className="text-lg font-medium">{resolvedTitle}</p>
      <p className="mt-1 text-sm text-muted-foreground">{resolvedDescription}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
