import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Textarea } from 'src/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { PageHeader } from 'src/components/shared/PageHeader'
import { LoadingState } from 'src/components/shared/LoadingState'
import { useProductFormData, useCreateProduct, useUpdateProduct } from 'src/hooks/useProductForm'
import { useCategories } from 'src/hooks/useCategories'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0),
  price_before_discount: z.number().min(0).optional(),
  quantity: z.number().int().min(0),
  category: z.string().min(1, 'Category is required'),
  image: z.string().min(1, 'Image URL is required'),
  location: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ProductFormPage() {
  const { t } = useTranslation('products')
  const { t: tc } = useTranslation('common')
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: product, isLoading } = useProductFormData(id)
  const { data: categories } = useCategories()
  const createMut = useCreateProduct(() => navigate('/products'))
  const updateMut = useUpdateProduct(() => navigate('/products'))

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (product) {
      setValue('name', product.name)
      setValue('description', product.description || '')
      setValue('price', product.price)
      setValue('price_before_discount', product.price_before_discount)
      setValue('quantity', product.quantity)
      setValue(
        'category',
        typeof product.category === 'object' ? product.category._id : product.category,
      )
      setValue('image', product.image)
      setValue('location', product.location || '')
    }
  }, [product, setValue])

  const onSubmit = (data: FormData) =>
    isEdit ? updateMut.mutate({ id: id!, data }) : createMut.mutate(data)
  const isPending = createMut.isPending || updateMut.isPending

  if (isEdit && isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? t('form.editProduct') : t('form.newProduct')} />
      <Card>
        <CardHeader>
          <CardTitle>{t('form.productDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="product-name">{t('form.name')}</Label>
              <Input
                id="product-name"
                {...register('name')}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'product-name-error' : undefined}
              />
              {errors.name && (
                <p id="product-name-error" className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="product-description">{t('form.description')}</Label>
              <Textarea id="product-description" {...register('description')} rows={3} />
            </div>
            <div>
              <Label htmlFor="product-price">{t('form.price')}</Label>
              <Input
                id="product-price"
                type="number"
                {...register('price', { valueAsNumber: true })}
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? 'product-price-error' : undefined}
              />
              {errors.price && (
                <p id="product-price-error" className="text-xs text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="product-price-before">{t('form.priceBeforeDiscount')}</Label>
              <Input
                id="product-price-before"
                type="number"
                {...register('price_before_discount', { setValueAs: (v: string) => { const n = parseFloat(v); return isNaN(n) ? undefined : n } })}
              />
            </div>
            <div>
              <Label htmlFor="product-quantity">{t('form.quantity')}</Label>
              <Input id="product-quantity" type="number" {...register('quantity', { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="product-category">{t('form.category')}</Label>
              <Select
                onValueChange={(v) => setValue('category', v || '')}
                defaultValue={
                  product
                    ? typeof product.category === 'object'
                      ? product.category._id
                      : product.category
                    : undefined
                }
              >
                <SelectTrigger
                  id="product-category"
                  aria-invalid={!!errors.category}
                  aria-describedby={errors.category ? 'product-category-error' : undefined}
                >
                  <SelectValue placeholder={t('form.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p id="product-category-error" className="text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="product-image">{t('form.imageUrl')}</Label>
              <Input
                id="product-image"
                {...register('image')}
                aria-invalid={!!errors.image}
                aria-describedby={errors.image ? 'product-image-error' : undefined}
              />
              {errors.image && (
                <p id="product-image-error" className="text-xs text-destructive">
                  {errors.image.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="product-location">{t('form.location')}</Label>
              <Input id="product-location" {...register('location')} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEdit ? tc('buttons.update') : tc('buttons.create')}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/products')}>
                {tc('buttons.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
