import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import productApi from 'src/apis/product.api';
import Product from 'src/pages/ProductList/components/Product';
import { ProductListConfig } from 'src/types/product.type';
import { RetryError } from 'src/types/utils.type';
import { sectionEntrance } from 'src/styles/animations';
import path from 'src/constant/path';

interface RelatedProductsProps {
  categoryId: string;
  reducedMotion: boolean;
}

const RelatedProducts = ({ categoryId, reducedMotion }: RelatedProductsProps) => {
  const { t } = useTranslation('product');
  const queryConfig: ProductListConfig = { limit: '20', page: '1', category: categoryId };

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', queryConfig],
    queryFn: ({ signal }) => {
      return productApi.getProducts(queryConfig, { signal });
    },
    enabled: Boolean(categoryId),
    staleTime: 3 * 60 * 1000,
    retry: (failureCount, error: RetryError) => {
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        return false;
      }
      return failureCount < 1;
    },
  });

  return (
    <motion.div
      className="mt-4"
      variants={reducedMotion ? undefined : sectionEntrance}
      initial={reducedMotion ? undefined : 'hidden'}
      whileInView={reducedMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className="container">
        <h2 className="text-gray-400 uppercase dark:text-gray-500">
          {t('related.youMayAlsoLike')}
        </h2>
        {isLoading && (
          <div
            className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            role="status"
            aria-label={t('related.loading')}
          >
            <span className="sr-only">{t('related.loading')}</span>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="col-span-1">
                <div className="animate-pulse rounded-sm bg-white shadow-sm dark:bg-slate-800">
                  <div className="w-full pt-[100%] bg-gray-300 dark:bg-slate-700" />
                  <div className="p-2">
                    <div className="mb-2 h-4 rounded bg-gray-300 dark:bg-slate-700" />
                    <div className="h-4 w-2/3 rounded bg-gray-300 dark:bg-slate-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {productsData && (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {productsData.data.data.products.map((product) => (
              <div className="col-span-1" key={product._id}>
                <Product product={product} />
              </div>
            ))}
          </div>
        )}
        {/* See More */}
        <Link
          to={`${path.products}?category=${categoryId}`}
          className="mt-6 flex min-h-11 w-full items-center justify-center rounded-sm border border-orange py-2.5 text-sm font-medium text-orange transition-colors hover:bg-orange/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-400/10"
        >
          {t('related.seeMore')}
        </Link>
      </div>
    </motion.div>
  );
};

export default RelatedProducts;
