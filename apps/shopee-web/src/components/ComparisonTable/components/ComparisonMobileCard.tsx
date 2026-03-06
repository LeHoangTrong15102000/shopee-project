import { Link } from 'react-router'
import { Product } from 'src/types/product.type'
import { formatCurrency, formatNumberToSocialStyle, generateNameId } from 'src/utils/utils'
import Button from 'src/components/Button'
import path from 'src/constant/path'

interface ComparisonMobileCardProps {
  compareList: Product[]
  removeFromCompare: (id: string) => void
  onAddToCart?: (product: Product) => void
}

export default function ComparisonMobileCard({ compareList, removeFromCompare }: ComparisonMobileCardProps) {
  return (
    <div className='space-y-4 md:hidden'>
      {compareList.map((product) => (
        <div
          key={product._id}
          className='rounded-lg border border-gray-200 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-800'
        >
          <div className='mb-3 flex items-center justify-between'>
            <Link
              to={`${path.home}${generateNameId({ name: product.name, id: product._id })}`}
              className='flex items-center gap-3'
            >
              <img
                src={product.image}
                alt={`Hình ảnh sản phẩm ${product.name}`}
                className='h-16 w-16 rounded-lg object-cover'
              />
              <span className='line-clamp-2 text-sm font-medium dark:text-gray-200'>{product.name}</span>
            </Link>
            <Button
              animated={false}
              onClick={() => removeFromCompare(product._id)}
              className='shrink-0 rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700'
              aria-label={`Xóa ${product.name} khỏi so sánh`}
            >
              <svg
                className='h-4 w-4 text-gray-400 dark:text-gray-500'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </Button>
          </div>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-gray-500 dark:text-gray-400'>Giá</span>
              <span className='font-medium text-orange'>₫{formatCurrency(product.price)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-500 dark:text-gray-400'>Đánh giá</span>
              <span className='dark:text-gray-200'>{product.rating} ⭐</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-500 dark:text-gray-400'>Đã bán</span>
              <span className='dark:text-gray-200'>{formatNumberToSocialStyle(product.sold)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
