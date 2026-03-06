import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ExtendedPurchase } from 'src/types/purchases.type'
import { ShippingMethod } from 'src/types/checkout.type'
import OrderSummary from 'src/components/OrderSummary'
import Button from 'src/components/Button'
import { PaymentIcons, TrustIndicators } from './TrustIndicators'

interface CheckoutSidebarProps {
  checkedItems: ExtendedPurchase[]
  selectedShippingMethod: ShippingMethod | null
  voucherDiscount: number
  voucherCode: string
  coinsUsed: number
  totalAmount: number
  isFormValid: boolean
  onRemoveVoucher: () => void
  onGoToReview: () => void
}

export const CheckoutSidebar = ({
  checkedItems,
  selectedShippingMethod,
  voucherDiscount,
  voucherCode,
  coinsUsed,
  totalAmount,
  isFormValid,
  onRemoveVoucher,
  onGoToReview
}: CheckoutSidebarProps) => {
  const { t } = useTranslation('checkout')
  return (
    <div className='lg:col-span-1'>
      <div className='sticky top-4 space-y-4'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <OrderSummary
            items={checkedItems}
            shippingMethod={selectedShippingMethod}
            voucherDiscount={voucherDiscount}
            voucherCode={voucherCode}
            onRemoveVoucher={onRemoveVoucher}
            coinsUsed={coinsUsed}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='rounded-xl border border-orange-100/30 bg-linear-to-br from-white via-orange-50/10 to-amber-50/10 p-4 shadow-lg md:p-6 dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 dark:shadow-slate-900/50'
        >
          <div className='mb-4 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-slate-700'>
            <span className='text-base font-medium text-gray-700 md:text-lg dark:text-gray-200'>{t('total')}</span>
            <span className='text-xl font-bold text-orange md:text-2xl'>₫{totalAmount.toLocaleString('vi-VN')}</span>
          </div>

          <div className='mb-4 flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 py-2 dark:border-green-800/40 dark:bg-green-900/20'>
            <svg
              className='h-4 w-4 text-green-600 dark:text-green-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
            <span className='text-xs font-medium text-green-700 md:text-sm dark:text-green-300'>
              {t('securePayment')}
            </span>
          </div>

          <Button
            onClick={onGoToReview}
            disabled={!isFormValid}
            className='w-full rounded-xl bg-linear-to-r from-orange via-orange to-amber-500 py-3 text-base font-semibold text-white shadow-lg shadow-orange/30 transition-all hover:from-orange-600 hover:via-orange-500 hover:to-amber-400 hover:shadow-xl hover:shadow-orange/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none md:py-4 md:text-lg dark:shadow-slate-900/50'
          >
            {t('placeOrder')}
          </Button>

          <p className='mt-3 text-center text-[10px] text-gray-500 md:text-xs dark:text-gray-400'>
            {t('placeOrderHint')}
          </p>

          <div className='mt-4 border-t border-gray-100 pt-4 dark:border-slate-700'>
            <p className='mb-2 text-center text-[10px] text-gray-500 md:text-xs dark:text-gray-400'>
              {t('acceptedPayments')}
            </p>
            <PaymentIcons />
          </div>

          <TrustIndicators />
        </motion.div>
      </div>
    </div>
  )
}
