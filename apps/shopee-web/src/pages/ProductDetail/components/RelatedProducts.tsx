import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import productApi from 'src/apis/product.api'
import Product from 'src/pages/ProductList/components/Product'
import { ProductListConfig } from 'src/types/product.type'
import { RetryError } from 'src/types/utils.type'
import { sectionEntrance } from 'src/styles/animations'

interface RelatedProductsProps {
  categoryId: string
  reducedMotion: boolean
}

const RelatedProducts = ({ categoryId, reducedMotion }: RelatedProductsProps) => {
  const { t } = useTranslation('product')
  const queryConfig: ProductListConfig = { limit: '20', page: '1', category: categoryId }

  const { data: productsData } = useQuery({
    queryKey: ['products', queryConfig],
    queryFn: ({ signal }) => {
      return productApi.getProducts(queryConfig, { signal })
    },
    enabled: Boolean(categoryId),
    staleTime: 3 * 60 * 1000,
    retry: (failureCount, error: RetryError) => {
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        return false
      }
      return failureCount < 1
    }
  })

  return (
    <motion.div
      className='mt-8'
      variants={reducedMotion ? undefined : sectionEntrance}
      initial={reducedMotion ? undefined : 'hidden'}
      whileInView={reducedMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className='container'>
        <div className='text-gray-400 uppercase dark:text-gray-500'>{t('related.youMayAlsoLike')}</div>
        {productsData && (
          <div className='mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {productsData.data.data.products.map((product) => (
              <div className='col-span-1' key={product._id}>
                <Product product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default RelatedProducts
