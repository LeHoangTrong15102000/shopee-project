import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { PageHeader } from 'src/components/shared/PageHeader';
import { LoadingState } from 'src/components/shared/LoadingState';
import productsApi from 'src/apis/products.api';
import categoriesApi from 'src/apis/categories.api';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  price_before_discount: z.coerce.number().min(0).optional(),
  quantity: z.coerce.number().int().min(0),
  category: z.string().min(1, 'Category is required'),
  image: z.string().min(1, 'Image URL is required'),
  location: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => productsApi.getProduct(id!).then((r) => r.data.data),
    enabled: isEdit,
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesApi.getCategories().then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (product) {
      setValue('name', product.name);
      setValue('description', product.description || '');
      setValue('price', product.price);
      setValue('price_before_discount', product.price_before_discount);
      setValue('quantity', product.quantity);
      setValue(
        'category',
        typeof product.category === 'object' ? product.category._id : product.category,
      );
      setValue('image', product.image);
      setValue('location', product.location || '');
    }
  }, [product, setValue]);

  const createMut = useMutation({
    mutationFn: (data: FormData) => productsApi.createProduct(data),
    onSuccess: () => {
      toast.success('Product created');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/products');
    },
    onError: () => toast.error('Failed to create product'),
  });

  const updateMut = useMutation({
    mutationFn: (data: FormData) => productsApi.updateProduct(id!, data),
    onSuccess: () => {
      toast.success('Product updated');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/products');
    },
    onError: () => toast.error('Failed to update product'),
  });

  const onSubmit = (data: FormData) => (isEdit ? updateMut.mutate(data) : createMut.mutate(data));
  const isPending = createMut.isPending || updateMut.isPending;

  if (isEdit && isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? 'Edit Product' : 'New Product'} />
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="product-name">Name</Label>
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
              <Label htmlFor="product-description">Description</Label>
              <Textarea id="product-description" {...register('description')} rows={3} />
            </div>
            <div>
              <Label htmlFor="product-price">Price</Label>
              <Input
                id="product-price"
                type="number"
                {...register('price')}
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
              <Label htmlFor="product-price-before">Price Before Discount</Label>
              <Input
                id="product-price-before"
                type="number"
                {...register('price_before_discount')}
              />
            </div>
            <div>
              <Label htmlFor="product-quantity">Quantity</Label>
              <Input id="product-quantity" type="number" {...register('quantity')} />
            </div>
            <div>
              <Label htmlFor="product-category">Category</Label>
              <Select
                onValueChange={(v) => setValue('category', v)}
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
                  <SelectValue placeholder="Select category" />
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
              <Label htmlFor="product-image">Image URL</Label>
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
              <Label htmlFor="product-location">Location</Label>
              <Input id="product-location" {...register('location')} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEdit ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/products')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
