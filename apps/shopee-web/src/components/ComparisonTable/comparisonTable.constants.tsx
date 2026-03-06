import { motion } from 'framer-motion'
import { Product } from 'src/types/product.type'

export interface BestValues {
  bestPrice: number
  bestRating: number
  bestSold: number
  bestDiscount: number
  bestStock: number
  recommendedProductId: string | null
}

export const getDiscountPercent = (product: Product): number => {
  if (product.price_before_discount <= product.price) return 0
  return Math.round(((product.price_before_discount - product.price) / product.price_before_discount) * 100)
}

export const getBestValues = (products: Product[]): BestValues | null => {
  if (products.length < 2) return null

  const prices = products.map((p) => p.price)
  const ratings = products.map((p) => p.rating)
  const soldCounts = products.map((p) => p.sold)
  const discounts = products.map((p) => getDiscountPercent(p))
  const stocks = products.map((p) => p.quantity)

  const maxPrice = Math.max(...prices)
  const maxSold = Math.max(...soldCounts)

  const scores = products.map((product) => {
    const discount = getDiscountPercent(product)
    const priceScore = maxPrice > 0 ? (1 - product.price / maxPrice) * 30 : 0
    const ratingScore = (product.rating / 5) * 30
    const soldScore = maxSold > 0 ? (product.sold / maxSold) * 20 : 0
    const discountScore = (discount / 100) * 20
    return priceScore + ratingScore + soldScore + discountScore
  })

  const maxScore = Math.max(...scores)
  const recommendedIndex = scores.indexOf(maxScore)

  return {
    bestPrice: Math.min(...prices),
    bestRating: Math.max(...ratings),
    bestSold: Math.max(...soldCounts),
    bestDiscount: Math.max(...discounts),
    bestStock: Math.max(...stocks),
    recommendedProductId: products[recommendedIndex]?._id || null
  }
}

interface BestBadgeProps {
  label: string
  reduceMotion: boolean
}

export const BestBadge = ({ label, reduceMotion }: BestBadgeProps) => {
  const badgeContent = (
    <span className='ml-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400'>
      ⭐ {label}
    </span>
  )

  if (reduceMotion) {
    return badgeContent
  }

  return (
    <motion.span
      className='ml-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400'
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      ⭐ {label}
    </motion.span>
  )
}
