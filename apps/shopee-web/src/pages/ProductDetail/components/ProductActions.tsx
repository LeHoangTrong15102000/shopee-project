import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import QuantityController from 'src/components/QuantityController'
import Button from 'src/components/Button'
import { Product as ProductType } from 'src/types/product.type'
import { useOptimisticAddToCart } from 'src/hooks/optimistic'
import path from 'src/constant/path'
import { staggerItem } from 'src/styles/animations'

interface ProductActionsProps {
  product: ProductType
  isAuthenticated: boolean
  reducedMotion: boolean
}

const CartIcon = () => (
  <svg
    enableBackground='new 0 0 15 15'
    viewBox='0 0 15 15'
    x={0}
    y={0}
    className='mr-3 h-[1em] w-[1em] fill-current stroke-orange text-[1.25rem] text-orange dark:text-orange-400'
  >
    <g>
      <g>
        <polyline
          fill='none'
          points='.5 .5 2.7 .5 5.2 11 12.4 11 14.5 3.5 3.7 3.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeMiterlimit={10}
        />
        <circle cx={6} cy='13.5' r={1} stroke='none' />
        <circle cx='11.5' cy='13.5' r={1} stroke='none' />
      </g>
      <line fill='none' strokeLinecap='round' strokeMiterlimit={10} x1='7.5' x2='10.5' y1={7} y2={7} />
      <line fill='none' strokeLinecap='round' strokeMiterlimit={10} x1={9} x2={9} y1='8.5' y2='5.5' />
    </g>
  </svg>
)

const ProductActions = ({ product, isAuthenticated, reducedMotion }: ProductActionsProps) => {
  const { t } = useTranslation('product')
  const navigate = useNavigate()
  const [buyCount, setBuyCount] = useState(1)
  const addToCartMutation = useOptimisticAddToCart()

  const handleBuyCount = (value: number) => {
    setBuyCount(value)
  }

  const addToCart = () => {
    if (!product) return

    addToCartMutation.mutate({
      product_id: product._id,
      buy_count: buyCount
    })
  }

  const handleBuyNow = async () => {
    if (!product) return

    try {
      const res = await addToCartMutation.mutateAsync({
        product_id: product._id,
        buy_count: buyCount
      })

      const purchase = res.data.data
      navigate(path.cart, {
        state: {
          purchaseId: purchase._id
        }
      })
    } catch (error) {
      console.error('Buy now error:', error)
      toast.error(t('actions.buyNowError'), {
        autoClose: 2000,
        position: 'top-center'
      })
    }
  }

  const handleLoginRedirect = () => {
    navigate(path.login, {
      state: {
        purchaseId: product._id,
        purchaseName: product.name
      }
    })
  }

  return (
    <>
      {/* Quantity Selector */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <div className='mt-8 flex items-center'>
          <div className='text-gray-500/80 capitalize dark:text-gray-400'>{t('actions.quantity')}</div>
          <QuantityController
            max={product?.quantity}
            value={buyCount}
            onDecrease={handleBuyCount}
            onIncrease={handleBuyCount}
            onType={handleBuyCount}
          />
          <div className='ml-7 flex items-center text-gray-500/80 dark:text-gray-400'>
            {product?.quantity} {t('available')}
          </div>
        </div>
      </motion.div>
      {/* Action Buttons */}
      <motion.div variants={reducedMotion ? undefined : staggerItem}>
        <div className='mt-10 flex items-center'>
          {/* Add to Cart Button */}
          <motion.div
            whileHover={reducedMotion ? undefined : { scale: 1.02 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
          >
            <Button
              variant='outline'
              animated={false}
              onClick={isAuthenticated ? addToCart : handleLoginRedirect}
              className='flex h-12 items-center justify-center rounded-xs px-5 capitalize shadow-xs'
            >
              <CartIcon />
              <span className='hidden text-orange sm:inline dark:text-orange-400'>{t('actions.addToCart')}</span>
              <span className='text-orange sm:hidden dark:text-orange-400'>{t('actions.addToCart')}</span>
            </Button>
          </motion.div>
          {/* Buy Now Button */}
          <motion.div
            className='ml-4'
            whileHover={reducedMotion ? undefined : { scale: 1.03 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
          >
            <Button
              variant='primary'
              animated={false}
              onClick={isAuthenticated ? handleBuyNow : handleLoginRedirect}
              className='flex h-12 min-w-20 items-center justify-center rounded-xs px-4 capitalize shadow-xs'
            >
              {t('actions.buyNow')}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}

export default ProductActions
