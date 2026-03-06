import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency } from 'src/utils/utils'
import { getEstimatedDeliveryDate } from 'src/utils/date'
import { ExtendedPurchase } from 'src/types/purchases.type'
import { Address, ShippingMethod, PaymentMethodType } from 'src/types/checkout.type'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { staggerContainer, staggerItem, STAGGER_DELAY } from 'src/styles/animations'
import ImageWithFallback from 'src/components/ImageWithFallback'
import Button from 'src/components/Button'
import { ShippingIcon, PaymentIcon } from 'src/components/Icons'

interface OrderPreviewProps {
  items: ExtendedPurchase[]
  selectedAddress: Address | null
  selectedShippingMethod: ShippingMethod | null
  selectedPaymentMethod: PaymentMethodType | null
  voucherCode?: string
  voucherDiscount?: number
  coinsUsed?: number
  note?: string
  onPlaceOrder: () => void
  onBack: () => void
  isPlacingOrder: boolean
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  e_wallet: 'Ví điện tử (MoMo, ZaloPay, VNPay)',
  credit_card: 'Thẻ tín dụng/Ghi nợ'
}

const SectionWrapper = memo(function SectionWrapper({
  title,
  children,
  reducedMotion,
  gradient
}: {
  title: string
  children: React.ReactNode
  reducedMotion: boolean
  gradient?: string
}) {
  return (
    <motion.div
      variants={reducedMotion ? undefined : staggerItem}
      className={`rounded-xl border border-gray-100/50 p-4 shadow-md md:p-6 dark:border-slate-700 ${gradient || 'bg-linear-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900/50'}`}
    >
      <h3 className='mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100'>{title}</h3>
      {children}
    </motion.div>
  )
})

const OrderPreview = memo(function OrderPreview({
  items,
  selectedAddress,
  selectedShippingMethod,
  selectedPaymentMethod,
  voucherCode,
  voucherDiscount = 0,
  coinsUsed = 0,
  note,
  onPlaceOrder,
  onBack,
  isPlacingOrder
}: OrderPreviewProps) {
  const reducedMotion = useReducedMotion()
  const containerVariants = staggerContainer(STAGGER_DELAY.normal)

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => total + item.price * item.buy_count, 0)
  }, [items])

  const shippingFee = selectedShippingMethod?.price || 0
  const coinsDiscount = coinsUsed
  const totalDiscount = voucherDiscount + coinsDiscount
  const total = subtotal + shippingFee - totalDiscount

  const estimatedDeliveryDate = useMemo(() => {
    if (!selectedShippingMethod) return null
    return getEstimatedDeliveryDate(selectedShippingMethod.estimatedDays)
  }, [selectedShippingMethod])

  const totalItemCount = useMemo(() => {
    return items.reduce((count, item) => count + item.buy_count, 0)
  }, [items])

  return (
    <motion.div
      variants={reducedMotion ? undefined : containerVariants}
      initial={reducedMotion ? undefined : 'hidden'}
      animate={reducedMotion ? undefined : 'visible'}
      className='space-y-4'
    >
      {/* Section 1: Địa chỉ giao hàng */}
      <SectionWrapper
        title='Địa chỉ giao hàng'
        reducedMotion={reducedMotion}
        gradient='bg-linear-to-br from-white via-orange-50/20 to-amber-50/10 dark:from-slate-800 dark:via-orange-900/10 dark:to-amber-900/5'
      >
        {selectedAddress ? (
          <div className='flex items-start gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange to-amber-500 shadow-md shadow-orange/30'>
              <svg className='h-5 w-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                />
              </svg>
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-gray-900 dark:text-gray-100'>{selectedAddress.fullName}</span>
                <span className='text-gray-400 dark:text-gray-500'>|</span>
                <span className='text-gray-600 dark:text-gray-300'>{selectedAddress.phone}</span>
                {selectedAddress.isDefault && (
                  <span className='rounded-full bg-linear-to-r from-orange to-amber-500 px-2.5 py-0.5 text-xs font-medium text-white shadow-xs'>
                    Mặc định
                  </span>
                )}
              </div>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-300'>
                {selectedAddress.street}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
              </p>
            </div>
          </div>
        ) : (
          <p className='text-gray-500 dark:text-gray-400'>Chưa chọn địa chỉ giao hàng</p>
        )}
      </SectionWrapper>

      {/* Section 2: Sản phẩm */}
      <SectionWrapper
        title={`Sản phẩm (${totalItemCount})`}
        reducedMotion={reducedMotion}
        gradient='bg-linear-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900/50'
      >
        <div className='space-y-3'>
          {items.map((item) => (
            <div
              key={item._id}
              className='flex gap-3 rounded-lg border border-gray-100 bg-linear-to-r from-gray-50 to-white p-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800'
            >
              <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-xs dark:border-slate-600'>
                <ImageWithFallback
                  src={item.product.image}
                  alt={item.product.name}
                  className='h-full w-full object-cover'
                />
                <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-r from-orange to-amber-500 text-xs font-medium text-white shadow-xs'>
                  {item.buy_count}
                </span>
              </div>
              <div className='min-w-0 flex-1'>
                <p className='line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100'>{item.product.name}</p>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>Số lượng: {item.buy_count}</p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-bold text-orange'>₫{formatCurrency(item.price * item.buy_count)}</p>
                {item.price_before_discount > item.price && (
                  <p className='text-xs text-gray-400 line-through dark:text-gray-500'>
                    ₫{formatCurrency(item.price_before_discount * item.buy_count)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* Section 3: Phương thức vận chuyển */}
      <SectionWrapper
        title='Phương thức vận chuyển'
        reducedMotion={reducedMotion}
        gradient='bg-linear-to-br from-white via-green-50/20 to-emerald-50/10 dark:from-slate-800 dark:via-green-900/10 dark:to-emerald-900/5'
      >
        {selectedShippingMethod ? (
          <div className='flex items-start gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-green-500 to-emerald-500 shadow-md shadow-green-500/30'>
              <ShippingIcon type={selectedShippingMethod.icon} className='h-5 w-5 text-white' />
            </div>
            <div className='flex-1'>
              <p className='font-semibold text-gray-900 dark:text-gray-100'>{selectedShippingMethod.name}</p>
              <p className='mt-0.5 text-sm text-gray-600 dark:text-gray-300'>{selectedShippingMethod.description}</p>
              {estimatedDeliveryDate && (
                <p className='mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 sm:mt-1.5 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-sm dark:bg-green-900/30 dark:text-green-400'>
                  <svg
                    className='h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'
                    />
                  </svg>
                  <span className='truncate'>
                    Dự kiến giao: <span className='font-semibold'>{estimatedDeliveryDate}</span>
                  </span>
                </p>
              )}
            </div>
            <div className='text-right'>
              <p className='font-bold text-green-600'>₫{formatCurrency(shippingFee)}</p>
            </div>
          </div>
        ) : (
          <p className='text-gray-500 dark:text-gray-400'>Chưa chọn phương thức vận chuyển</p>
        )}
      </SectionWrapper>

      {/* Section 4: Phương thức thanh toán */}
      <SectionWrapper
        title='Phương thức thanh toán'
        reducedMotion={reducedMotion}
        gradient='bg-linear-to-br from-white via-blue-50/20 to-indigo-50/10 dark:from-slate-800 dark:via-blue-900/10 dark:to-indigo-900/5'
      >
        {selectedPaymentMethod ? (
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30'>
              <PaymentIcon type={selectedPaymentMethod} className='h-5 w-5' />
            </div>
            <div className='flex-1'>
              <p className='font-semibold text-gray-900 dark:text-gray-100'>
                {PAYMENT_METHOD_LABELS[selectedPaymentMethod]}
              </p>
            </div>
          </div>
        ) : (
          <p className='text-gray-500 dark:text-gray-400'>Chưa chọn phương thức thanh toán</p>
        )}
      </SectionWrapper>

      {/* Section 5: Ghi chú */}
      {note && (
        <SectionWrapper
          title='Ghi chú đơn hàng'
          reducedMotion={reducedMotion}
          gradient='bg-linear-to-br from-white via-yellow-50/20 to-amber-50/10 dark:from-slate-800 dark:via-yellow-900/10 dark:to-amber-900/5'
        >
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-yellow-400 to-amber-500 shadow-md shadow-yellow-500/30'>
              <svg className='h-5 w-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                />
              </svg>
            </div>
            <p className='flex-1 text-sm text-gray-700 dark:text-gray-300'>{note}</p>
          </div>
        </SectionWrapper>
      )}

      {/* Section 6: Tổng kết đơn hàng */}
      <SectionWrapper
        title='Tổng kết đơn hàng'
        reducedMotion={reducedMotion}
        gradient='bg-linear-to-br from-white via-orange-50/30 to-amber-50/20 dark:from-slate-800 dark:via-orange-900/20 dark:to-amber-900/10'
      >
        <div className='space-y-3'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600 dark:text-gray-300'>Tạm tính ({totalItemCount} sản phẩm)</span>
            <span className='font-medium text-gray-900 dark:text-gray-100'>₫{formatCurrency(subtotal)}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600 dark:text-gray-300'>Phí vận chuyển</span>
            <span className='font-medium text-gray-900 dark:text-gray-100'>₫{formatCurrency(shippingFee)}</span>
          </div>
          {voucherDiscount > 0 && (
            <div className='flex justify-between text-sm'>
              <span className='text-green-600'>Voucher giảm giá {voucherCode && `(${voucherCode})`}</span>
              <span className='font-medium text-green-600'>-₫{formatCurrency(voucherDiscount)}</span>
            </div>
          )}
          {coinsDiscount > 0 && (
            <div className='flex justify-between text-sm'>
              <span className='text-yellow-600'>Shopee Xu ({coinsUsed} xu)</span>
              <span className='font-medium text-yellow-600'>-₫{formatCurrency(coinsDiscount)}</span>
            </div>
          )}
          <div className='border-t-2 border-orange/20 pt-3'>
            <div className='flex items-center justify-between'>
              <span className='text-base font-semibold text-gray-900 dark:text-gray-100'>Tổng thanh toán</span>
              <span className='bg-linear-to-r from-orange to-red-500 bg-clip-text text-2xl font-bold text-transparent'>
                ₫{formatCurrency(Math.max(0, total))}
              </span>
            </div>
            {totalDiscount > 0 && (
              <p className='mt-1 text-right text-xs font-medium text-green-600'>
                <svg
                  className='mr-1 inline-block h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z'
                  />
                </svg>
                Tiết kiệm ₫{formatCurrency(totalDiscount)}
              </p>
            )}
          </div>
        </div>
      </SectionWrapper>

      {/* Action Buttons */}
      <motion.div
        variants={reducedMotion ? undefined : staggerItem}
        className='flex flex-col gap-3 rounded-xl border border-gray-100/50 bg-linear-to-br from-white to-gray-50/50 p-4 shadow-lg md:flex-row md:p-6 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900/50'
      >
        <Button
          onClick={onBack}
          className='flex-1 rounded-xl border-2 border-gray-200 bg-white py-3 font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:hover:border-slate-500 dark:hover:bg-slate-600'
        >
          <span className='flex items-center justify-center gap-2'>
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
            Quay lại
          </span>
        </Button>
        <Button
          onClick={onPlaceOrder}
          disabled={isPlacingOrder}
          isLoading={isPlacingOrder}
          className='flex-1 rounded-xl bg-linear-to-r from-orange via-orange to-amber-500 py-3 font-semibold text-white shadow-lg shadow-orange/30 transition-all hover:from-orange-600 hover:via-orange-500 hover:to-amber-400 hover:shadow-xl hover:shadow-orange/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none md:flex-2'
        >
          {isPlacingOrder ? 'Đang xử lý...' : 'Đặt hàng'}
        </Button>
      </motion.div>

      {/* Terms notice */}
      <motion.p
        variants={reducedMotion ? undefined : staggerItem}
        className='text-center text-xs text-gray-500 dark:text-gray-400'
      >
        Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo{' '}
        <a href='#' className='text-orange hover:underline'>
          Điều khoản Shopee
        </a>
      </motion.p>
    </motion.div>
  )
})

export default OrderPreview
