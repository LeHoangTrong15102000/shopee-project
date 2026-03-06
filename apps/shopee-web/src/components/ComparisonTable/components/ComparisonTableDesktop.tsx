import { Link } from 'react-router'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import { Product } from 'src/types/product.type'
import { formatCurrency, formatNumberToSocialStyle, generateNameId } from 'src/utils/utils'
import ProductRating from 'src/components/ProductRating'
import Button from 'src/components/Button'
import path from 'src/constant/path'
import { BestBadge, BestValues, getDiscountPercent } from '../comparisonTable.constants'

interface ComparisonTableDesktopProps {
  compareList: Product[]
  bestValues: BestValues | null
  removeFromCompare: (id: string) => void
  handleAddToCart: (product: Product) => void
  reduceMotion: boolean
}

export default function ComparisonTableDesktop({
  compareList,
  bestValues,
  removeFromCompare,
  handleAddToCart,
  reduceMotion
}: ComparisonTableDesktopProps) {
  return (
    <table className='hidden w-full border-collapse md:table' role='table' aria-label='So sánh sản phẩm'>
      <thead className='sticky top-0 z-10 bg-white dark:bg-slate-800'>
        <tr role='row'>
          <th
            scope='col'
            className='w-32 border-b p-3 text-left text-sm font-medium text-gray-600 dark:border-slate-700 dark:text-gray-300'
            role='columnheader'
          >
            Thuộc tính
          </th>
          {compareList.map((product) => (
            <th
              key={product._id}
              scope='col'
              className='relative min-w-[200px] border-b p-3 text-center dark:border-slate-700'
              role='columnheader'
            >
              <Button
                animated={false}
                onClick={() => removeFromCompare(product._id)}
                className='absolute top-2 right-2 rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700'
                aria-label={`Xóa ${product.name} khỏi so sánh`}
              >
                <svg
                  className='h-4 w-4 text-gray-400 dark:text-gray-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  aria-hidden='true'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </Button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody aria-live='polite'>
        <ImageRow compareList={compareList} />
        <NameRow compareList={compareList} />
        <PriceRow compareList={compareList} bestValues={bestValues} reduceMotion={reduceMotion} />
        <OriginalPriceRow compareList={compareList} />
        <DiscountRow compareList={compareList} bestValues={bestValues} reduceMotion={reduceMotion} />
        <RatingRow compareList={compareList} bestValues={bestValues} reduceMotion={reduceMotion} />
        <SoldRow compareList={compareList} bestValues={bestValues} reduceMotion={reduceMotion} />
        <StockRow compareList={compareList} bestValues={bestValues} reduceMotion={reduceMotion} />
        <CategoryRow compareList={compareList} />
        {bestValues && (
          <RecommendationRow compareList={compareList} bestValues={bestValues} reduceMotion={reduceMotion} />
        )}
        <ActionRow compareList={compareList} handleAddToCart={handleAddToCart} removeFromCompare={removeFromCompare} />
      </tbody>
    </table>
  )
}

function ImageRow({ compareList }: { compareList: Product[] }) {
  return (
    <tr role='row'>
      <th
        scope='row'
        className='border-b p-3 text-left text-sm font-normal text-gray-600 dark:border-slate-700 dark:text-gray-300'
        role='rowheader'
      >
        Hình ảnh
      </th>
      {compareList.map((product) => (
        <td key={product._id} className='border-b p-3 text-center dark:border-slate-700' role='cell'>
          <Link
            to={`${path.home}${generateNameId({ name: product.name, id: product._id })}`}
            aria-label={`Xem chi tiết sản phẩm ${product.name}`}
          >
            <img
              src={product.image}
              alt={`Hình ảnh sản phẩm ${product.name}`}
              className='mx-auto h-24 w-24 rounded-lg object-cover transition-opacity hover:opacity-80'
            />
          </Link>
        </td>
      ))}
    </tr>
  )
}

function NameRow({ compareList }: { compareList: Product[] }) {
  return (
    <tr role='row'>
      <th
        scope='row'
        className='border-b p-3 text-left text-sm font-normal text-gray-600 dark:border-slate-700 dark:text-gray-300'
        role='rowheader'
      >
        Tên sản phẩm
      </th>
      {compareList.map((product) => (
        <td key={product._id} className='border-b p-3 text-center dark:border-slate-700' role='cell'>
          <Link
            to={`${path.home}${generateNameId({ name: product.name, id: product._id })}`}
            className='line-clamp-2 text-sm font-medium text-gray-800 hover:text-orange dark:text-gray-200 dark:hover:text-orange-400'
            aria-label={`Xem chi tiết sản phẩm ${product.name}`}
          >
            {product.name}
          </Link>
        </td>
      ))}
    </tr>
  )
}

interface RowWithBestProps {
  compareList: Product[]
  bestValues: BestValues | null
  reduceMotion: boolean
}

function PriceRow({ compareList, bestValues, reduceMotion }: RowWithBestProps) {
  return (
    <tr role='row'>
      <th
        scope='row'
        className='border-b p-3 text-left text-sm font-normal text-gray-600 dark:border-slate-700 dark:text-gray-300'
        role='rowheader'
      >
        Giá
      </th>
      {compareList.map((product) => {
        const isBest = bestValues && product.price === bestValues.bestPrice
        return (
          <td
            key={product._id}
            className={classNames('border-b p-3 text-center dark:border-slate-700', {
              'bg-green-50 dark:bg-green-900/20': isBest
            })}
            role='cell'
          >
            <span className='font-semibold text-orange'>₫{formatCurrency(product.price)}</span>
            {isBest && <BestBadge label='Giá tốt nhất' reduceMotion={reduceMotion} />}
          </td>
        )
      })}
    </tr>
  )
}

function OriginalPriceRow({ compareList }: { compareList: Product[] }) {
  return (
    <tr role='row'>
      <th
        scope='row'
        className='border-b p-3 text-left text-sm font-normal text-gray-600 dark:border-slate-700 dark:text-gray-300'
        role='rowheader'
      >
        Giá gốc
      </th>
      {compareList.map((product) => (
        <td key={product._id} className='border-b p-3 text-center dark:border-slate-700' role='cell'>
          <span className='text-sm text-gray-400 line-through dark:text-gray-500'>
            ₫{formatCurrency(product.price_before_discount)}
          </span>
        </td>
      ))}
    </tr>
  )
}

function DiscountRow({ compareList, bestValues, reduceMotion }: RowWithBestProps) {
  return (
    <tr role='row'>
      <th
        scope='row'
        className='border-b p-3 text-left text-sm font-normal text-gray-600 dark:border-slate-700 dark:text-gray-300'
        role='rowheader'
      >
        Giảm giá
      </th>
      {compareList.map((product) => {
        const discount = getDiscountPercent(product)
        const isBest = bestValues && discount === bestValues.bestDiscount && discount > 0
        return (
          <td
            key={product._id}
            className={classNames('border-b p-3 text-center dark:border-slate-700', {
              'bg-green-50 dark:bg-green-900/20': isBest
            })}
            role='cell'
          >
            {discount > 0 ? (
              <>
                <span className='font-medium text-red-500 dark:text-red-400'>-{discount}%</span>
                {isBest && <BestBadge label='Giảm nhiều nhất' reduceMotion={reduceMotion} />}
              </>
            ) : (
              <span className='text-gray-400 dark:text-gray-500'>-</span>
            )}
          </td>
        )
      })}
    </tr>
  )
}

function RatingRow({ compareList, bestValues, reduceMotion }: RowWithBestProps) {
  return (
    <tr role='row'>
      <th
        scope='row'
        className='border-b p-3 text-left text-sm font-normal text-gray-600 dark:border-slate-700 dark:text-gray-300'
        role='rowheader'
      >
        Đánh giá
      </th>
      {compareList.map((product) => {
        const isBest = bestValues && product.rating === bestValues.bestRating
        return (
          <td
            key={product._id}
            className={classNames('border-b p-3 dark:border-slate-700', {
              'bg-green-50 dark:bg-green-900/20': isBest
            })}
            role='cell'
          >
            <div className='flex flex-wrap items-center justify-center gap-1'>
              <ProductRating rating={product.rating} />
              <span className='text-sm text-gray-500 dark:text-gray-400'>({product.rating})</span>
              {isBest && <BestBadge label='Đánh giá cao nhất' reduceMotion={reduceMotion} />}
            </div>
          </td>
        )
      })}
    </tr>
  )
}

function SoldRow({ compareList, bestValues, reduceMotion }: RowWithBestProps) {
  return (
    <tr role='row'>
      <th
        scope='row'
        className='border-b p-3 text-left text-sm font-normal text-gray-600 dark:border-slate-700 dark:text-gray-300'
        role='rowheader'
      >
        Đã bán
      </th>
      {compareList.map((product) => {
        const isBest = bestValues && product.sold === bestValues.bestSold
        return (
          <td
            key={product._id}
            className={classNames('border-b p-3 text-center dark:border-slate-700', {
              'bg-green-50 dark:bg-green-900/20': isBest
            })}
            role='cell'
          >
            <span className='text-sm text-gray-700 dark:text-gray-300'>{formatNumberToSocialStyle(product.sold)}</span>
            {isBest && <BestBadge label='Bán chạy nhất' reduceMotion={reduceMotion} />}
          </td>
        )
      })}
    </tr>
  )
}

function StockRow({ compareList, bestValues, reduceMotion }: RowWithBestProps) {
  return (
    <tr role='row'>
      <th
        scope='row'
        className='border-b p-3 text-left text-sm font-normal text-gray-600 dark:border-slate-700 dark:text-gray-300'
        role='rowheader'
      >
        Tồn kho
      </th>
      {compareList.map((product) => {
        const isBest = bestValues && product.quantity === bestValues.bestStock
        return (
          <td
            key={product._id}
            className={classNames('border-b p-3 text-center dark:border-slate-700', {
              'bg-green-50 dark:bg-green-900/20': isBest
            })}
            role='cell'
          >
            <span className='text-sm text-gray-700 dark:text-gray-300'>
              {formatNumberToSocialStyle(product.quantity)}
            </span>
            {isBest && <BestBadge label='Còn nhiều nhất' reduceMotion={reduceMotion} />}
          </td>
        )
      })}
    </tr>
  )
}

function CategoryRow({ compareList }: { compareList: Product[] }) {
  return (
    <tr role='row'>
      <th
        scope='row'
        className='border-b p-3 text-left text-sm font-normal text-gray-600 dark:border-slate-700 dark:text-gray-300'
        role='rowheader'
      >
        Danh mục
      </th>
      {compareList.map((product) => (
        <td key={product._id} className='border-b p-3 text-center dark:border-slate-700' role='cell'>
          <span className='text-sm text-gray-700 dark:text-gray-300'>{product.category?.name || '-'}</span>
        </td>
      ))}
    </tr>
  )
}

function RecommendationRow({ compareList, bestValues, reduceMotion }: RowWithBestProps) {
  return (
    <tr role='row'>
      <th
        scope='row'
        className='border-b p-3 text-left text-sm font-normal text-gray-600 dark:border-slate-700 dark:text-gray-300'
        role='rowheader'
      >
        Đề xuất
      </th>
      {compareList.map((product) => {
        const isRecommended = product._id === bestValues?.recommendedProductId
        return (
          <td
            key={product._id}
            className={classNames('border-b p-3 text-center dark:border-slate-700', {
              'bg-orange-50 dark:bg-orange-900/20': isRecommended
            })}
            role='cell'
          >
            {isRecommended ? (
              reduceMotion ? (
                <span className='rounded-full bg-orange px-3 py-1 text-sm font-medium text-white'>⭐ Đề xuất</span>
              ) : (
                <motion.span
                  className='inline-block rounded-full bg-orange px-3 py-1 text-sm font-medium text-white'
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  ⭐ Đề xuất
                </motion.span>
              )
            ) : (
              <span className='text-gray-400 dark:text-gray-500'>-</span>
            )}
          </td>
        )
      })}
    </tr>
  )
}

interface ActionRowProps {
  compareList: Product[]
  handleAddToCart: (product: Product) => void
  removeFromCompare: (id: string) => void
}

function ActionRow({ compareList, handleAddToCart, removeFromCompare }: ActionRowProps) {
  return (
    <tr role='row'>
      <td className='p-3 text-sm text-gray-600 dark:text-gray-300' role='cell'></td>
      {compareList.map((product) => (
        <td key={product._id} className='p-3 text-center' role='cell'>
          <div className='flex flex-col gap-2'>
            <Button
              animated={false}
              onClick={() => handleAddToCart(product)}
              className='w-full rounded-sm bg-orange px-4 py-2 text-sm text-white transition-colors hover:bg-[#d73211]'
              aria-label={`Thêm ${product.name} vào giỏ hàng`}
            >
              Thêm vào giỏ
            </Button>
            <Button
              animated={false}
              onClick={() => removeFromCompare(product._id)}
              className='w-full rounded-sm border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
              aria-label={`Xóa ${product.name} khỏi bảng so sánh`}
            >
              Xóa khỏi so sánh
            </Button>
          </div>
        </td>
      ))}
    </tr>
  )
}
