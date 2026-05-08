import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import type { PaymentMethod } from 'src/types/payment.types'

interface Props {
  open: boolean
  method: PaymentMethod | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
}

export default function PaymentDeleteDialog({ open, method, onOpenChange, onConfirm, isLoading }: Props) {
  const { t } = useTranslation('payments')

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('delete.title')}
      description={method ? t('delete.description', { name: method.name }) : t('delete.descriptionFallback')}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  )
}
