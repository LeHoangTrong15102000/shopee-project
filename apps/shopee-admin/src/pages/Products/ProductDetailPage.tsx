import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { PageHeader } from 'src/components/shared/PageHeader';
import { LoadingState } from 'src/components/shared/LoadingState';
import { ErrorState } from 'src/components/shared/ErrorState';
import { useProductDetail } from 'src/hooks/useProductDetail';
import { formatCurrency } from 'src/utils/format';

export default function ProductDetailPage() {
  const { t } = useTranslation('products');
  const { t: tc } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading, error } = useProductDetail(id);

  if (isLoading) return <LoadingState />;
  if (error || !product)
    return <ErrorState message={t('notFound')} onRetry={() => navigate('/products')} />;

  const categoryName =
    typeof product.category === 'object' ? product.category.name : product.category;

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
              <ArrowLeft className="mr-2 size-4" />
              {tc('buttons.back')}
            </Button>
            <Button size="sm" onClick={() => navigate(`/products/${id}/edit`)}>
              <Pencil className="mr-2 size-4" />
              {tc('buttons.edit')}
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('detail.details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="h-48 w-full rounded-md object-cover"
              />
            )}
            <p className="text-sm text-muted-foreground">
              {product.description || tc('states.noDescription')}
            </p>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('detail.price')}</span>
                <span className="font-medium">{formatCurrency(product.price)}</span>
              </div>
              {product.price_before_discount > product.price && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('detail.original')}</span>
                  <span className="line-through">
                    {formatCurrency(product.price_before_discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('detail.stock')}</span>
                <span>{product.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('detail.sold')}</span>
                <span>{product.sold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('detail.rating')}</span>
                <Badge variant="secondary">{product.rating.toFixed(1)} ★</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('detail.category')}</span>
                <span>{categoryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('detail.created')}</span>
                <span>{format(new Date(product.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
