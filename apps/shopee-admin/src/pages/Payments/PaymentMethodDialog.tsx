import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Textarea } from 'src/components/ui/textarea'
import { Label } from 'src/components/ui/label'
import { Switch } from 'src/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { useCreatePaymentMethod, useUpdatePaymentMethod } from 'src/hooks/usePayments'
import { paymentMethodSchema, PAYMENT_TYPE_OPTIONS, type PaymentMethodFormValues } from 'src/lib/schemas/payment.schema'
import type { PaymentMethod } from 'src/types/payment.types'

interface Props {
  open: boolean
  method: PaymentMethod | null
  onOpenChange: (open: boolean) => void
}

export default function PaymentMethodDialog({ open, method, onOpenChange }: Props) {
  const { t } = useTranslation('payments')
  const { t: tc } = useTranslation('common')
  const isEdit = !!method

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema) as unknown as Resolver<PaymentMethodFormValues>,
    defaultValues: {
      name: '',
      description: '',
      icon: '',
      type: 'cod',
      is_active: true,
      sort_order: 0,
      instructions: '',
    },
  })

  const isActive = watch('is_active')
  const selectedType = watch('type')

  useEffect(() => {
    if (open && method) {
      reset({
        name: method.name,
        description: method.description ?? '',
        icon: method.icon ?? '',
        type: method.type,
        is_active: method.is_active,
        sort_order: method.sort_order,
        instructions: method.instructions ?? '',
      })
    } else if (open && !method) {
      reset({
        name: '',
        description: '',
        icon: '',
        type: 'cod',
        is_active: true,
        sort_order: 0,
        instructions: '',
      })
    }
  }, [open, method, reset])

  const createMut = useCreatePaymentMethod(() => onOpenChange(false))
  const updateMut = useUpdatePaymentMethod(() => onOpenChange(false))

  function onSubmit(values: PaymentMethodFormValues) {
    if (isEdit && method) {
      updateMut.mutate({ id: method._id, body: values })
    } else {
      createMut.mutate(values)
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('actions.edit') : t('actions.create')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pm-name">{t('form.name')}</Label>
              <Input id="pm-name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pm-type">{t('form.type')}</Label>
              <Select
                value={selectedType}
                onValueChange={(val) => setValue('type', val as PaymentMethodFormValues['type'])}
              >
                <SelectTrigger id="pm-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {t(`types.${opt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pm-icon">{t('form.icon')}</Label>
              <Input id="pm-icon" {...register('icon')} placeholder="credit-card" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pm-description">{t('form.description')}</Label>
              <Input id="pm-description" {...register('description')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pm-instructions">{t('form.instructions')}</Label>
              <Textarea id="pm-instructions" rows={3} {...register('instructions')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pm-sort">{t('form.sortOrder')}</Label>
              <Input id="pm-sort" type="number" min={0} {...register('sort_order')} />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Label htmlFor="pm-active">{t('form.isActive')}</Label>
              <Switch
                id="pm-active"
                checked={isActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? tc('buttons.save') : tc('buttons.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
