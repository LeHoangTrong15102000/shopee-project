import { useTranslation } from 'react-i18next'
import { Product as ProductType } from 'src/types/product.type'

interface ProductSpecificationsProps {
  product: ProductType
}

const ProductSpecifications = ({ product }: ProductSpecificationsProps) => {
  const { t } = useTranslation('product')

  const specs = [
    { label: t('specs.category'), value: product.category?.name || '-' },
    { label: t('specs.stock'), value: product.quantity?.toLocaleString() || '-' },
    { label: t('specs.shipsFrom'), value: product.location || t('shipping.defaultLocation') },
  ]

  return (
    <div className="mb-6">
      <h2
        id="specs-heading"
        className="mb-4 text-base font-medium text-gray-900 uppercase dark:text-gray-100"
      >
        {t('detail.specifications')}
      </h2>
      <table className="w-full text-sm" aria-labelledby="specs-heading">
        <tbody>
          {specs.map((spec, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-slate-700/50' : ''}>
              <th
                scope="row"
                className="w-40 px-4 py-2.5 text-left font-normal text-gray-500 dark:text-gray-400"
              >
                {spec.label}
              </th>
              <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductSpecifications
