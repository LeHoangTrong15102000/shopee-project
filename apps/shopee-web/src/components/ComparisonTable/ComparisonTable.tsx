import { memo, useCallback, useMemo } from 'react'
import classNames from 'classnames'
import { Product } from 'src/types/product.type'
import { useProductComparison } from 'src/hooks/useProductComparison'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import Button from 'src/components/Button'
import { getBestValues } from './comparisonTable.constants'
import ComparisonTableEmpty from './components/ComparisonTableEmpty'
import ComparisonSummary from './components/ComparisonSummary'
import ComparisonMobileCard from './components/ComparisonMobileCard'
import ComparisonTableDesktop from './components/ComparisonTableDesktop'

interface ComparisonTableProps {
  className?: string
  onAddToCart?: (product: Product) => void
}

function ComparisonTable({ className, onAddToCart }: ComparisonTableProps) {
  const { compareList, removeFromCompare, clearCompare } = useProductComparison()
  const reduceMotion = useReducedMotion()

  const bestValues = useMemo(() => getBestValues(compareList), [compareList])

  const comparisonSummary = useMemo(() => {
    if (!bestValues || compareList.length < 2) return null

    const summaryParts: { text: string; productName: string; color: string }[] = []

    const bestPriceProduct = compareList.find((p) => p.price === bestValues.bestPrice)
    if (bestPriceProduct) {
      summaryParts.push({
        text: 'có giá tốt nhất',
        productName: bestPriceProduct.name,
        color: 'text-green-600'
      })
    }

    const bestRatingProduct = compareList.find((p) => p.rating === bestValues.bestRating)
    if (bestRatingProduct && bestRatingProduct._id !== bestPriceProduct?._id) {
      summaryParts.push({
        text: 'có đánh giá cao nhất',
        productName: bestRatingProduct.name,
        color: 'text-blue-600'
      })
    }

    const bestSoldProduct = compareList.find((p) => p.sold === bestValues.bestSold)
    if (
      bestSoldProduct &&
      bestSoldProduct._id !== bestPriceProduct?._id &&
      bestSoldProduct._id !== bestRatingProduct?._id
    ) {
      summaryParts.push({
        text: 'bán chạy nhất',
        productName: bestSoldProduct.name,
        color: 'text-orange-600'
      })
    }

    return summaryParts
  }, [bestValues, compareList])

  const handleAddToCart = useCallback(
    (product: Product) => {
      onAddToCart?.(product)
    },
    [onAddToCart]
  )

  if (compareList.length === 0) {
    return <ComparisonTableEmpty className={className} />
  }

  return (
    <div className={classNames('overflow-x-auto', className)} role='region' aria-label='Bảng so sánh sản phẩm'>
      <ComparisonSummary comparisonSummary={comparisonSummary} />

      <div className='mb-4 flex justify-end'>
        <Button
          animated={false}
          onClick={clearCompare}
          className='text-sm text-gray-500 transition-colors hover:text-orange dark:text-gray-400 dark:hover:text-orange-400'
          aria-label='Xóa tất cả sản phẩm khỏi bảng so sánh'
        >
          Xóa tất cả
        </Button>
      </div>

      <ComparisonMobileCard compareList={compareList} removeFromCompare={removeFromCompare} onAddToCart={onAddToCart} />

      <ComparisonTableDesktop
        compareList={compareList}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={reduceMotion}
      />
    </div>
  )
}

export default memo(ComparisonTable)
