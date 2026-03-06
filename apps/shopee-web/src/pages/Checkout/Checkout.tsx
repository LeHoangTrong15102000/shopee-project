import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import SEO from 'src/components/SEO'
import { useCheckout } from './useCheckout'
import { CheckoutProgressStepper } from './components/CheckoutProgressStepper'
import { CheckoutFormSections } from './components/CheckoutFormSections'
import { CheckoutSidebar } from './components/CheckoutSidebar'
import OrderPreview from 'src/components/OrderPreview'

const Checkout = () => {
  const { t } = useTranslation('checkout')
  const {
    selectedAddress,
    selectedShippingMethod,
    selectedPaymentMethod,
    voucherCode,
    voucherDiscount,
    coinsUsed,
    note,
    showReview,
    checkedItems,
    isFormValid,
    currentStep,
    totalAmount,
    createOrderMutation,
    setVoucherCode,
    setCoinsUsed,
    setNote,
    handleAddressSelect,
    handleShippingSelect,
    handlePaymentSelect,
    handleApplyVoucher,
    handleRemoveVoucher,
    handleBackToStep3,
    handleGoToReview,
    handlePlaceOrder
  } = useCheckout()

  if (checkedItems.length === 0) {
    return null
  }

  return (
    <div className='min-h-screen bg-linear-to-b from-neutral-100 via-orange-50/10 to-neutral-100 py-4 md:py-8 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900'>
      <SEO title={t('title')} noindex />
      <div className='container'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-4 overflow-hidden rounded-lg bg-linear-to-r from-orange via-orange/90 to-orange-400 p-3 shadow-lg sm:rounded-xl sm:p-4 md:mb-6 md:p-6'
        >
          <div className='flex items-center gap-2.5 sm:gap-3'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs sm:h-11 sm:w-11 md:h-12 md:w-12'>
              <svg
                className='h-[18px] w-[18px] text-white sm:h-5 sm:w-5 md:h-6 md:w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
            </div>
            <div className='min-w-0 flex-1'>
              <h1 className='truncate text-base leading-tight font-bold text-white sm:text-lg md:text-2xl'>
                {t('title')}
              </h1>
              <p className='mt-0.5 truncate text-[11px] leading-snug text-white/80 sm:text-xs md:text-sm'>
                {t('subtitle')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='mb-6 rounded-xl border border-orange-100/30 bg-linear-to-r from-white via-orange-50/20 to-white p-4 shadow-lg md:p-6 dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 dark:shadow-slate-900/50'
        >
          <CheckoutProgressStepper currentStep={currentStep} />
        </motion.div>

        {/* Show OrderPreview when user clicks "Đặt hàng ngay", otherwise show the form */}
        {showReview ? (
          <OrderPreview
            items={checkedItems}
            selectedAddress={selectedAddress}
            selectedShippingMethod={selectedShippingMethod}
            selectedPaymentMethod={selectedPaymentMethod}
            voucherCode={voucherCode}
            voucherDiscount={voucherDiscount}
            coinsUsed={coinsUsed}
            note={note}
            onPlaceOrder={handlePlaceOrder}
            onBack={handleBackToStep3}
            isPlacingOrder={createOrderMutation.isPending}
          />
        ) : (
          <div className='grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3'>
            <CheckoutFormSections
              selectedAddress={selectedAddress}
              selectedShippingMethod={selectedShippingMethod}
              selectedPaymentMethod={selectedPaymentMethod}
              voucherCode={voucherCode}
              voucherDiscount={voucherDiscount}
              coinsUsed={coinsUsed}
              note={note}
              onAddressSelect={handleAddressSelect}
              onShippingSelect={handleShippingSelect}
              onPaymentSelect={handlePaymentSelect}
              onApplyVoucher={handleApplyVoucher}
              onVoucherCodeChange={setVoucherCode}
              onCoinsChange={setCoinsUsed}
              onNoteChange={setNote}
            />
            <CheckoutSidebar
              checkedItems={checkedItems}
              selectedShippingMethod={selectedShippingMethod}
              voucherDiscount={voucherDiscount}
              voucherCode={voucherCode}
              coinsUsed={coinsUsed}
              totalAmount={totalAmount}
              isFormValid={isFormValid}
              onRemoveVoucher={handleRemoveVoucher}
              onGoToReview={handleGoToReview}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Checkout
