import { Tooltip } from '@heroui/tooltip'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Button from 'src/components/Button'
import ShopeeCheckbox from 'src/components/ShopeeCheckbox'
import { ExtendedPurchase } from '../types'

interface CartSummaryBarProps {
  extendedPurchases: ExtendedPurchase[]
  isAllChecked: boolean
  checkedPurchaseCount: number
  animatedTotalPrice: number
  animatedSavingsPrice: number
  totalCheckedPurchasePrice: number
  totalCheckedPurchaseSavingPrice: number
  handleCheckedAll: () => void
  handleDeleteManyPurchases: () => void
  handleBuyPurchases: () => void
  formatCurrency: (value: number) => string
}

const CartSummaryBar = ({
  extendedPurchases,
  isAllChecked,
  checkedPurchaseCount,
  animatedTotalPrice,
  animatedSavingsPrice,
  totalCheckedPurchasePrice,
  totalCheckedPurchaseSavingPrice,
  handleCheckedAll,
  handleDeleteManyPurchases,
  handleBuyPurchases,
  formatCurrency
}: CartSummaryBarProps) => {
  const { t } = useTranslation('cart')
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className='sticky bottom-0 z-10 mt-10 flex flex-col rounded-xs border border-[rgba(0,0,0,.08)] bg-white px-4 py-5 shadow-sm sm:flex-row sm:items-center sm:px-9 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50'
    >
      <div className='flex items-center select-none'>
        <div className='flex shrink-0 items-center justify-center pr-3'>
          <ShopeeCheckbox checked={isAllChecked} onChange={handleCheckedAll} size='md' />
        </div>
        <Button
          variant='text'
          onClick={handleCheckedAll}
          className='mx-3 border-none bg-none text-sm capitalize hover:text-orange sm:text-sm dark:hover:text-orange-400'
        >
          {t('summary.selectAll')} ({extendedPurchases.length})
        </Button>
        <Button
          variant='text'
          onClick={handleDeleteManyPurchases}
          className='mx-3 border-none bg-none text-sm capitalize hover:text-red-500 sm:text-sm'
        >
          {t('summary.delete')}
        </Button>
      </div>

      <div className='mt-3 flex flex-col gap-2 sm:mt-0 sm:ml-auto sm:flex-row sm:items-center sm:gap-4 md:flex-row md:items-center'>
        <div className='flex flex-col justify-end'>
          <div className='flex flex-wrap items-center sm:justify-end md:justify-end'>
            <div className='text-sm text-gray-700 sm:text-sm dark:text-gray-200'>
              {t('summary.totalPayment')} ({isAllChecked ? extendedPurchases.length : checkedPurchaseCount}{' '}
              {t('summary.products')}):{' '}
            </div>
            <motion.div
              className='ml-2 text-xl font-medium text-[#ee4d2d] sm:text-xl md:text-2xl'
              key={totalCheckedPurchasePrice}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              ₫{formatCurrency(animatedTotalPrice)}
            </motion.div>

            {checkedPurchaseCount > 0 && (
              <Tooltip
                content={
                  <div className='w-full max-w-[90vw] rounded-lg border border-gray-200 bg-white p-4 shadow-lg sm:w-96 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50'>
                    <div className='mb-3 border-b border-gray-200 pb-2 text-sm font-medium text-gray-700 dark:border-slate-700 dark:text-gray-200'>
                      {t('summary.promotionDetails')}
                    </div>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600 dark:text-gray-300'>{t('summary.totalGoods')}</span>
                        <span className='text-gray-900 dark:text-gray-100'>
                          ₫{formatCurrency(totalCheckedPurchasePrice + totalCheckedPurchaseSavingPrice)}
                        </span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600 dark:text-gray-300'>{t('summary.voucherDiscount')}</span>
                        <span className='text-red-500'>-₫{formatCurrency(totalCheckedPurchaseSavingPrice)}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600 dark:text-gray-300'>{t('summary.productDiscount')}</span>
                        <span className='text-red-500'>-₫{formatCurrency(totalCheckedPurchaseSavingPrice)}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600 dark:text-gray-300'>{t('summary.savings')}</span>
                        <span className='text-red-500'>-₫{formatCurrency(totalCheckedPurchaseSavingPrice)}</span>
                      </div>
                      <hr className='my-2 border-gray-200 dark:border-slate-700' />
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600 dark:text-gray-300'>{t('summary.totalAmount')}</span>
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          ₫{formatCurrency(totalCheckedPurchasePrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                }
                placement='top-end'
                showArrow={false}
                offset={5}
                delay={0}
                closeDelay={100}
                classNames={{
                  base: 'p-0 bg-transparent',
                  content: 'p-0 bg-transparent'
                }}
              >
                <button className='group ml-2 text-gray-600 transition-all duration-100 hover:scale-110 hover:text-[#ee4d2d] active:scale-90 dark:text-gray-400'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-4 w-4 rotate-180 transition-transform duration-75 group-hover:rotate-0'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 15.75l7.5-7.5 7.5 7.5' />
                  </svg>
                </button>
              </Tooltip>
            )}
          </div>
          <div className='flex items-center text-sm sm:justify-end sm:text-sm md:justify-end'>
            <div className='text-gray-500 dark:text-gray-400'>{t('summary.savings')}</div>
            <motion.div
              className='relative ml-7 overflow-hidden text-[#ee4d2d]'
              key={totalCheckedPurchaseSavingPrice}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              ₫{formatCurrency(animatedSavingsPrice)}
              {totalCheckedPurchaseSavingPrice > 0 && (
                <motion.div
                  className='absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent'
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          </div>
        </div>
        <motion.div
          animate={
            checkedPurchaseCount > 0
              ? {
                  boxShadow: [
                    '0 0 0 0 rgba(239, 68, 68, 0)',
                    '0 0 0 6px rgba(239, 68, 68, 0.15)',
                    '0 0 0 0 rgba(239, 68, 68, 0)'
                  ]
                }
              : {}
          }
          transition={{ duration: 0.1 }}
          className='transition-transform duration-100 hover:scale-105 active:scale-95'
          style={{ borderRadius: '4px' }}
        >
          <Button
            onClick={handleBuyPurchases}
            disabled={checkedPurchaseCount === 0}
            type='button'
            className='mt-1 flex h-10 w-full items-center justify-center bg-red-500 text-center text-base text-white capitalize transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:ml-0 sm:w-52 sm:text-sm md:mt-0 md:ml-0 md:w-52'
          >
            {t('summary.buy')} ({checkedPurchaseCount})
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default CartSummaryBar
