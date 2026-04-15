import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'src/components/ui/alert-dialog'
import { useTranslation } from 'react-i18next'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onConfirm: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  variant = 'destructive',
  isLoading,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common')
  const resolvedTitle = title ?? t('dialog.areYouSure')
  const resolvedDescription = description ?? t('dialog.cannotBeUndone')
  const resolvedConfirmText = confirmText ?? t('buttons.confirm')
  const resolvedCancelText = cancelText ?? t('buttons.cancel')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{resolvedCancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={
              variant === 'destructive' ? 'bg-destructive text-white hover:bg-destructive/90' : ''
            }
          >
            {isLoading ? t('states.loading') : resolvedConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
