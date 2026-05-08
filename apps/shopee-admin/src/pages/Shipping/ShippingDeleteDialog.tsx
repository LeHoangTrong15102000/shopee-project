import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import type { ShippingMethod } from 'src/types/shipping.types'

interface Props {
  open: boolean
  method: ShippingMethod | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
}

export default function ShippingDeleteDialog({ open, method, onOpenChange, onConfirm, isLoading }: Props) {
  const { t } = useTranslation('shipping')

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
