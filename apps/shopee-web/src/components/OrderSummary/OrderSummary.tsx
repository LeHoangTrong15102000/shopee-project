import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency } from 'src/utils/utils'
import { getEstimatedDeliveryDate } from 'src/utils/date'
import { ExtendedPurchase } from 'src/types/purchases.type'
import { ShippingMethod } from 'src/types/checkout.type'
import ImageWithFallback from 'src/components/ImageWithFallback'
import { ShippingIcon } from 'src/components/Icons'
import Button from 'src/components/Button'

interface OrderSummaryProps {
  items: ExtendedPurchase[]
  shippingMethod: ShippingMethod | null
  voucherDiscount?: number
  voucherCode?: string
  onRemoveVoucher?: () => void
  coinsUsed?: number
  coinsValue?: number
}

const VISIBLE_ITEMS_COUNT = 2
const VAT_RATE = 0.1

const OrderSummary = memo(function OrderSummary({
  items,
  shippingMethod,
  voucherDiscount = 0,
  voucherCode,
  onRemoveVoucher,
  coinsUsed = 0,
  coinsValue = 1
}: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => total + item.price * item.buy_count, 0)
  }, [items])

  const originalTotal = useMemo(() => {
    return items.reduce((total, item) => total + item.price_before_discount * item.buy_count, 0)
  }, [items])

  // Số sản phẩm unique (không tính số lượng mua)
  const uniqueProductCount = items.length

  const productDiscount = originalTotal - subtotal
  const shippingFee = shippingMethod?.price || 0
  const coinsDiscount = coinsUsed * coinsValue
  const vatAmount = 0
  const totalDiscount = productDiscount + voucherDiscount + coinsDiscount
  const total = subtotal + shippingFee + vatAmount - voucherDiscount - coinsDiscount

  const estimatedDeliveryDate = useMemo(() => {
    if (!shippingMethod) return null
    return getEstimatedDeliveryDate(shippingMethod.estimatedDays)
  }, [shippingMethod])

  const hiddenItemsCount = items.length - VISIBLE_ITEMS_COUNT

  return (
    <div className='overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800'>
      {/* Header with item count badge */}
      <div className='border-b border-gray-100 bg-linear-to-r from-orange/5 to-transparent px-6 py-4 dark:border-slate-700'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>Đơn hàng của bạn</h3>
          <span className='inline-flex items-center gap-1 rounded-full bg-orange/10 px-3 py-1 text-sm font-medium text-orange'>
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
              />
            </svg>
            {uniqueProductCount} sản phẩm
          </span>
        </div>
      </div>

      <div className='p-6'>
        {/* Collapsible Product List */}
        <div className='space-y-3'>
          {/* Always-visible items */}
          {items.slice(0, VISIBLE_ITEMS_COUNT).map((item) => (
            <div key={item._id} className='flex gap-3 rounded-lg bg-gray-50 p-3 dark:bg-slate-900'>
              <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-slate-600'>
                <ImageWithFallback
                  src={item.product.image}
                  alt={item.product.name}
                  className='h-full w-full object-cover'
                />
                <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange text-xs font-medium text-white'>
                  {item.buy_count}
                </span>
              </div>
              <div className='min-w-0 flex-1'>
                <p className='line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100'>{item.product.name}</p>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>SL: {item.buy_count}</p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-semibold text-orange'>₫{formatCurrency(item.price * item.buy_count)}</p>
                {item.price_before_discount > item.price && (
                  <p className='text-xs text-gray-400 line-through dark:text-gray-500'>
                    ₫{formatCurrency(item.price_before_discount * item.buy_count)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Expandable hidden items - CSS transition for smooth 60fps animation */}
          {hiddenItemsCount > 0 && (
            <div
              className='overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out'
              style={{
                maxHeight: isExpanded ? `${hiddenItemsCount * 100}px` : '0px',
                opacity: isExpanded ? 1 : 0
              }}
            >
              <div className='space-y-3'>
                {items.slice(VISIBLE_ITEMS_COUNT).map((item) => (
                  <div key={item._id} className='flex gap-3 rounded-lg bg-gray-50 p-3 dark:bg-slate-900'>
                    <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-slate-600'>
                      <ImageWithFallback
                        src={item.product.image}
                        alt={item.product.name}
                        className='h-full w-full object-cover'
                      />
                      <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange text-xs font-medium text-white'>
                        {item.buy_count}
                      </span>
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100'>
                        {item.product.name}
                      </p>
                      <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>SL: {item.buy_count}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-semibold text-orange'>
                        ₫{formatCurrency(item.price * item.buy_count)}
                      </p>
                      {item.price_before_discount > item.price && (
                        <p className='text-xs text-gray-400 line-through dark:text-gray-500'>
                          ₫{formatCurrency(item.price_before_discount * item.buy_count)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expand/Collapse button */}
          {hiddenItemsCount > 0 && (
            <Button
              animated={false}
              type='button'
              onClick={() => setIsExpanded(!isExpanded)}
              className='flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-orange hover:bg-orange/5 hover:text-orange dark:border-slate-600 dark:text-gray-300 dark:hover:text-orange-400'
            >
              {isExpanded ? (
                <>
                  <svg
                    className='h-4 w-4 transition-transform duration-300'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
                  </svg>
                  Thu gọn
                </>
              ) : (
                <>
                  <svg
                    className='h-4 w-4 transition-transform duration-300'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                  Xem thêm {hiddenItemsCount} sản phẩm
                </>
              )}
            </Button>
          )}
        </div>

        {/* Voucher Success Indicator */}
        {voucherDiscount > 0 && voucherCode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mt-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3'
          >
            <div className='flex items-center gap-2'>
              <span className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white'>
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
              </span>
              <div>
                <p className='text-sm font-medium text-green-800'>Mã "{voucherCode}" đã được áp dụng</p>
                <p className='text-xs text-green-600'>Giảm ₫{formatCurrency(voucherDiscount)}</p>
              </div>
            </div>
            {onRemoveVoucher && (
              <Button
                variant='ghost'
                animated={false}
                type='button'
                onClick={onRemoveVoucher}
                className='rounded-sm p-1 text-green-600 transition-colors hover:bg-green-100 hover:text-red-500'
                aria-label='Xóa mã giảm giá'
              >
                <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </Button>
            )}
          </motion.div>
        )}

        {/* Price Breakdown Section */}
        <div className='mt-6 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-slate-900'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600 dark:text-gray-300'>Tạm tính</span>
            <span className='font-medium text-gray-900 dark:text-gray-100'>₫{formatCurrency(subtotal)}</span>
          </div>

          {productDiscount > 0 && (
            <div className='flex justify-between text-sm'>
              <span className='text-green-600'>Giảm giá sản phẩm</span>
              <span className='font-medium text-green-600'>-₫{formatCurrency(productDiscount)}</span>
            </div>
          )}

          <div className='flex justify-between text-sm'>
            <span className='text-gray-600 dark:text-gray-300'>Phí vận chuyển</span>
            <span className='font-medium text-gray-900 dark:text-gray-100'>
              {shippingMethod ? (
                `₫${formatCurrency(shippingFee)}`
              ) : (
                <span className='text-gray-400 dark:text-gray-500'>Chưa chọn</span>
              )}
            </span>
          </div>

          {voucherDiscount > 0 && (
            <div className='flex justify-between text-sm'>
              <span className='text-green-600'>Voucher giảm giá</span>
              <span className='font-medium text-green-600'>-₫{formatCurrency(voucherDiscount)}</span>
            </div>
          )}

          {coinsDiscount > 0 && (
            <div className='flex justify-between text-sm'>
              <span className='text-yellow-600'>Shopee Xu ({coinsUsed} xu)</span>
              <span className='font-medium text-yellow-600'>-₫{formatCurrency(coinsDiscount)}</span>
            </div>
          )}

          {/* VAT Display */}
          <div className='flex justify-between text-sm'>
            <span className='text-gray-500 dark:text-gray-400'>VAT ({VAT_RATE * 100}%)</span>
            <span className='text-gray-500 dark:text-gray-400'>₫{formatCurrency(vatAmount)}</span>
          </div>
        </div>

        {/* Total Section */}
        <div className='mt-4 rounded-lg border-2 border-orange/20 bg-linear-to-r from-orange/5 to-orange/10 p-4 dark:from-orange/10 dark:to-orange/20'>
          <div className='flex items-center justify-between'>
            <span className='text-base font-semibold text-gray-900 dark:text-gray-100'>Tổng thanh toán</span>
            <div className='text-right'>
              <motion.span
                key={total}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className='text-2xl font-bold text-orange'
              >
                ₫{formatCurrency(Math.max(0, total))}
              </motion.span>
              {totalDiscount > 0 && (
                <p className='mt-1 text-xs font-medium text-green-600'>
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
        </div>

        {/* Estimated Delivery Date */}
        {shippingMethod && estimatedDeliveryDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mt-4 rounded-lg border border-green-200 bg-green-50 p-4'
          >
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-white'>
                <ShippingIcon type={shippingMethod.icon} className='h-5 w-5 text-green-500' />
              </div>
              <div className='flex-1'>
                <p className='text-sm font-semibold text-green-800'>{shippingMethod.name}</p>
                <p className='mt-0.5 text-sm font-medium text-green-600'>
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
                      d='M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'
                    />
                  </svg>
                  Dự kiến giao: <span className='font-semibold'>{estimatedDeliveryDate}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Money-back Guarantee Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className='mt-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4'
        >
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-white'>
            <svg
              className='h-5 w-5 text-emerald-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={1.5}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
              />
            </svg>
          </div>
          <div className='flex-1'>
            <p className='text-sm font-semibold text-emerald-800'>Đảm bảo hoàn tiền</p>
            <p className='text-xs text-emerald-600'>Hoàn tiền 100% nếu hàng không như mô tả</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
})

export default OrderSummary
