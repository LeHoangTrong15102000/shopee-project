import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/ui/button'
import { cn } from 'src/lib/utils'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation('common')
  const resolvedMessage = message ?? t('states.somethingWentWrong')

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="mb-4 size-12 text-destructive" />
      <p className="text-lg font-medium">{t('states.error')}</p>
      <p className="mt-1 text-sm text-muted-foreground">{resolvedMessage}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4" size="sm">
          {t('buttons.retry')}
        </Button>
      )}
    </div>
  )
}
