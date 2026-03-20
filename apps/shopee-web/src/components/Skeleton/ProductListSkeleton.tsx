import { useTranslation } from 'react-i18next';
import ProductCardSkeleton from './ProductCardSkeleton';

interface ProductListSkeletonProps {
  count?: number;
}

export default function ProductListSkeleton({ count = 20 }: ProductListSkeletonProps) {
  const { t } = useTranslation('common');
  return (
    <div
      className="mt-6 grid min-h-[600px] grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      role="status"
      aria-busy="true"
      aria-label={t('loading.productList')}
    >
      {[...Array(count)].map((_, index) => (
        <div className="col-span-1" key={index}>
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}
