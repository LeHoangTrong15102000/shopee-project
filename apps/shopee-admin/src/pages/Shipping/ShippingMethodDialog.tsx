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
import { Label } from 'src/components/ui/label'
import { Switch } from 'src/components/ui/switch'
import { useCreateShippingMethod, useUpdateShippingMethod } from 'src/hooks/useShipping'
import {
  shippingMethodSchema,
  type ShippingMethodFormValues,
} from 'src/lib/schemas/shipping.schema'
import type { ShippingMethod } from 'src/types/shipping.types'

interface Props {
  open: boolean
  method: ShippingMethod | null
  onOpenChange: (open: boolean) => void
}

export default function ShippingMethodDialog({ open, method, onOpenChange }: Props) {
  const { t } = useTranslation('shipping')
  const { t: tc } = useTranslation('common')
  const isEdit = !!method

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShippingMethodFormValues>({
    resolver: zodResolver(shippingMethodSchema) as unknown as Resolver<ShippingMethodFormValues>,
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      estimated_days_min: 1,
      estimated_days_max: 3,
      icon: '',
      is_active: true,
      sort_order: 0,
    },
  })

  const isActive = watch('is_active')

  useEffect(() => {
    if (open && method) {
      reset({
        name: method.name,
        description: method.description ?? '',
        price: method.price,
        estimated_days_min: method.estimated_days_min,
        estimated_days_max: method.estimated_days_max,
        icon: method.icon ?? '',
        is_active: method.is_active,
        sort_order: method.sort_order,
      })
    } else if (open && !method) {
      reset({
        name: '',
        description: '',
        price: 0,
        estimated_days_min: 1,
        estimated_days_max: 3,
        icon: '',
        is_active: true,
        sort_order: 0,
      })
    }
  }, [open, method, reset])

  const createMut = useCreateShippingMethod(() => onOpenChange(false))
  const updateMut = useUpdateShippingMethod(() => onOpenChange(false))

  function onSubmit(values: ShippingMethodFormValues) {
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
          <DialogTitle>{isEdit ? t('actions.edit') : t('actions.create')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sm-name">{t('form.name')}</Label>
              <Input id="sm-name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sm-description">{t('form.description')}</Label>
              <Input id="sm-description" {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sm-price">{t('form.price')}</Label>
              <Input id="sm-price" type="number" min={0} {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sm-icon">{t('form.icon')}</Label>
              <Input id="sm-icon" {...register('icon')} placeholder="truck" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sm-days-min">{t('form.estimatedDaysMin')}</Label>
              <Input id="sm-days-min" type="number" min={0} {...register('estimated_days_min')} />
              {errors.estimated_days_min && (
                <p className="text-xs text-destructive">{errors.estimated_days_min.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sm-days-max">{t('form.estimatedDaysMax')}</Label>
              <Input id="sm-days-max" type="number" min={0} {...register('estimated_days_max')} />
              {errors.estimated_days_max && (
                <p className="text-xs text-destructive">{errors.estimated_days_max.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sm-sort">{t('form.sortOrder')}</Label>
              <Input id="sm-sort" type="number" min={0} {...register('sort_order')} />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Label htmlFor="sm-active">{t('form.isActive')}</Label>
              <Switch
                id="sm-active"
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
