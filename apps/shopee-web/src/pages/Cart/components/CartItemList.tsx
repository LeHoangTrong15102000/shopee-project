import { AnimatePresence, motion } from 'framer-motion'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import Button from 'src/components/Button'
import ImageWithFallback from 'src/components/ImageWithFallback'
import QuantityController from 'src/components/QuantityController'
import { InlineStockAlert } from 'src/components/RealTimeStockAlert'
import ShopeeCheckbox from 'src/components/ShopeeCheckbox'
import StockBadge from 'src/components/StockBadge'
import { useIsMobile } from 'src/hooks/useIsMobile'
import { Purchase } from 'src/types/purchases.type'
import { ExtendedPurchase, InlineStockAlertState } from '../types'

interface CartItemListProps {
  extendedPurchases: ExtendedPurchase[]
  purchasesInCart: Purchase[] | undefined
  isAllChecked: boolean
  inlineAlerts: Map<string, InlineStockAlertState>
  handleChecked: (purchaseIndex: number) => (event: React.ChangeEvent<HTMLInputElement>) => void
  handleCheckedAll: () => void
  handleQuantity: (purchaseIndex: number, value: number, enabled: boolean) => void
  handleTypeQuantity: (purchaseIndex: number) => (value: number) => void
  handleDelete: (purchaseIndex: number) => () => void
  handleSaveForLater: (purchaseIndex: number) => () => void
  handleDismissInlineAlert: (productId: string) => void
  path: { home: string }
  formatCurrency: (value: number) => string
  generateNameId: (params: { name: string; id: string }) => string
}

const CartItemList = ({
  extendedPurchases,
  purchasesInCart,
  isAllChecked,
  inlineAlerts,
  handleChecked,
  handleCheckedAll,
  handleQuantity,
  handleTypeQuantity,
  handleDelete,
  handleSaveForLater,
  handleDismissInlineAlert,
  path,
  formatCurrency,
  generateNameId
}: CartItemListProps) => {
  const { t } = useTranslation('cart')
  const isMobile = useIsMobile()

  return (
    <div className='overflow-auto'>
      {/* Desktop Layout - Table view (lg and above) */}
      <div className='hidden lg:block'>
        {/* Tiêu đề của các sản phẩm trong cart */}
        <div className='my-2 grid grid-cols-12 rounded-md bg-white px-9 py-5 text-sm text-gray-500 capitalize shadow-sm dark:bg-slate-800 dark:text-gray-300 dark:shadow-slate-900/50'>
          <div className='col-span-6'>
            <div className='flex items-center select-none'>
              <div className='flex shrink-0 items-center justify-center pr-3'>
                <ShopeeCheckbox checked={isAllChecked} onChange={handleCheckedAll} size='md' />
              </div>
              <div className='flex grow text-black dark:text-gray-100'>{t('list.product')}</div>
            </div>
          </div>
          <div className='col-span-6'>
            <div className='grid grid-cols-6 text-center text-[#888] dark:text-gray-400'>
              <div className='col-span-2'>{t('list.unitPrice')}</div>
              <div className='col-span-2'>{t('list.quantity')}</div>
              <div className='col-span-1'>{t('list.amount')}</div>
              <div className='col-span-1'>{t('list.actions')}</div>
            </div>
          </div>
        </div>
        {/* Giao diện các sản phẩm trong cart - body các sản phẩm */}
        {extendedPurchases.length > 0 && (
          <>
            {extendedPurchases?.map((purchase, index) => (
              <motion.div
                key={purchase._id}
                initial={isMobile ? false : { opacity: 0, y: 20 }}
                animate={isMobile ? undefined : { opacity: 1, y: 0 }}
                transition={isMobile ? undefined : { duration: 0.3, delay: index * 0.1 }}
                className='mt-5 grid grid-cols-12 items-center rounded-xs border border-[rgba(0,0,0,.09)] bg-white px-9 py-5 text-sm text-gray-500 transition-shadow first:mt-0 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:shadow-slate-900/50'
              >
                <div className='col-span-6'>
                  <div className='flex items-center select-none'>
                    <div className='flex shrink-0 items-center justify-center pr-3'>
                      <ShopeeCheckbox
                        checked={purchase.isChecked}
                        onChange={(checked) => {
                          handleChecked(index)({ target: { checked } } as React.ChangeEvent<HTMLInputElement>)
                        }}
                        size='md'
                      />
                    </div>
                    <div className='grow'>
                      <div className='flex items-center'>
                        <Link
                          to={`${path.home}${generateNameId({
                            name: purchase.product.name,
                            id: purchase.product._id
                          })}`}
                          className='h-20 w-20 shrink-0'
                        >
                          <ImageWithFallback
                            src={purchase.product.image}
                            alt={purchase.product.name}
                            className='h-full w-full rounded-sm object-cover'
                            loading='lazy'
                          />
                        </Link>
                        <div className='grow px-2 pt-1 pb-2'>
                          <Link
                            to={`${path.home}${generateNameId({
                              name: purchase.product.name,
                              id: purchase.product._id
                            })}`}
                            className='line-clamp-2 text-gray-800 transition-colors hover:text-[#ee4d2d] dark:text-gray-100'
                          >
                            {purchase.product.name}
                          </Link>
                          <div className='mt-1'>
                            <StockBadge
                              availableStock={purchase.product.quantity}
                              requestedQuantity={purchase.buy_count}
                            />
                          </div>
                          <AnimatePresence>
                            {inlineAlerts.has(purchase.product._id) && (
                              <InlineStockAlert
                                productId={purchase.product._id}
                                productName={inlineAlerts.get(purchase.product._id)!.productName}
                                newStock={inlineAlerts.get(purchase.product._id)!.newStock}
                                severity={inlineAlerts.get(purchase.product._id)!.severity}
                                onDismiss={() => handleDismissInlineAlert(purchase.product._id)}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='col-span-6'>
                  <div className='grid grid-cols-6 items-center'>
                    <div className='col-span-2'>
                      <div className='flex items-center justify-center gap-1 text-[15px]'>
                        <span className='truncate text-gray-500 line-through dark:text-gray-400'>
                          ₫{formatCurrency(purchase.product.price_before_discount)}
                        </span>
                        <span className='truncate text-black/90 dark:text-gray-100'>
                          ₫{formatCurrency(purchase.product.price)}
                        </span>
                      </div>
                    </div>
                    <div className='col-span-2'>
                      <QuantityController
                        handleDelete={handleDelete(index)}
                        product={purchase.product}
                        max={purchase.product.quantity}
                        value={purchase.buy_count}
                        classNameWrapper='flex items-center justify-center'
                        onIncrease={(value) =>
                          handleQuantity(index, value, purchase.buy_count < purchase.product.quantity)
                        }
                        onDecrease={(value) => handleQuantity(index, value, purchase.buy_count > 1)}
                        onType={handleTypeQuantity(index)}
                        onFocusOut={(value) =>
                          handleQuantity(
                            index,
                            value,
                            purchase.buy_count >= 1 &&
                              purchase.buy_count <= purchase.product.quantity &&
                              value !== (purchasesInCart as Purchase[])[index].buy_count
                          )
                        }
                        disabled={false}
                        isQuantityInCart={true}
                      />
                    </div>
                    <div className='col-span-1 overflow-hidden'>
                      <motion.span
                        className='flex items-center justify-center truncate text-[15px] font-medium text-[#ee4d2d]'
                        key={purchase.buy_count}
                        initial={{ scale: 0.9, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        ₫{formatCurrency(purchase.price * purchase.buy_count)}
                      </motion.span>
                    </div>
                    <div className='col-span-1 flex flex-col items-center justify-center gap-1'>
                      <Button
                        size='sm'
                        animated={false}
                        onClick={handleSaveForLater(index)}
                        className='flex items-center gap-1 rounded-md p-1.5 text-sm text-blue-500 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                        title={t('list.saveForLater')}
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                          strokeWidth={1.5}
                          stroke='currentColor'
                          className='h-4 w-4'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z'
                          />
                        </svg>
                        {t('list.save')}
                      </Button>
                      <Button
                        size='sm'
                        animated={false}
                        onClick={handleDelete(index)}
                        className='rounded-md p-1.5 text-black/90 transition-colors hover:font-medium hover:text-[#ee4d2d] dark:text-gray-200'
                      >
                        {t('list.delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Mobile Layout - Card view (below lg) */}
      <div className='block lg:hidden'>
        <div className='my-2 flex items-center rounded-md bg-white px-4 py-4 text-sm shadow-sm select-none dark:bg-slate-800 dark:shadow-slate-900/50'>
          <div className='flex shrink-0 items-center justify-center pr-3'>
            <ShopeeCheckbox checked={isAllChecked} onChange={handleCheckedAll} size='md' />
          </div>
          <span className='font-medium text-black dark:text-gray-100'>
            {t('list.selectAll')} ({extendedPurchases.length})
          </span>
        </div>

        {extendedPurchases.length > 0 && (
          <div className='space-y-3'>
            {extendedPurchases?.map((purchase, index) => (
              <motion.div
                key={purchase._id}
                initial={isMobile ? false : { opacity: 0, y: 20 }}
                animate={isMobile ? undefined : { opacity: 1, y: 0 }}
                transition={isMobile ? undefined : { duration: 0.3, delay: index * 0.1 }}
                className='rounded-lg bg-white p-4 shadow-xs dark:bg-slate-800 dark:shadow-slate-900/50'
              >
                <div className='flex gap-3 select-none'>
                  <div className='flex shrink-0 items-start pt-1'>
                    <ShopeeCheckbox
                      checked={purchase.isChecked}
                      onChange={(checked) => {
                        handleChecked(index)({ target: { checked } } as React.ChangeEvent<HTMLInputElement>)
                      }}
                      size='md'
                    />
                  </div>

                  <Link
                    to={`${path.home}${generateNameId({
                      name: purchase.product.name,
                      id: purchase.product._id
                    })}`}
                    className='h-20 w-20 shrink-0'
                  >
                    <ImageWithFallback
                      src={purchase.product.image}
                      alt={purchase.product.name}
                      className='h-full w-full rounded-sm object-cover'
                      loading='lazy'
                    />
                  </Link>

                  <div className='min-w-0 flex-1'>
                    <Link
                      to={`${path.home}${generateNameId({
                        name: purchase.product.name,
                        id: purchase.product._id
                      })}`}
                      className='line-clamp-2 text-sm text-gray-800 transition-colors hover:text-[#ee4d2d] dark:text-gray-100'
                    >
                      {purchase.product.name}
                    </Link>

                    <div className='mt-1'>
                      <StockBadge availableStock={purchase.product.quantity} requestedQuantity={purchase.buy_count} />
                    </div>

                    <AnimatePresence>
                      {inlineAlerts.has(purchase.product._id) && (
                        <InlineStockAlert
                          productId={purchase.product._id}
                          productName={inlineAlerts.get(purchase.product._id)!.productName}
                          newStock={inlineAlerts.get(purchase.product._id)!.newStock}
                          severity={inlineAlerts.get(purchase.product._id)!.severity}
                          onDismiss={() => handleDismissInlineAlert(purchase.product._id)}
                        />
                      )}
                    </AnimatePresence>

                    <div className='mt-2 flex items-center gap-2 text-sm'>
                      <span className='text-gray-400 line-through dark:text-gray-500'>
                        ₫{formatCurrency(purchase.product.price_before_discount)}
                      </span>
                      <span className='font-medium text-[#ee4d2d]'>₫{formatCurrency(purchase.product.price)}</span>
                    </div>

                    <div className='mt-3 flex items-center gap-2'>
                      <QuantityController
                        handleDelete={handleDelete(index)}
                        product={purchase.product}
                        max={purchase.product.quantity}
                        value={purchase.buy_count}
                        classNameWrapper='flex items-center'
                        onIncrease={(value) =>
                          handleQuantity(index, value, purchase.buy_count < purchase.product.quantity)
                        }
                        onDecrease={(value) => handleQuantity(index, value, purchase.buy_count > 1)}
                        onType={handleTypeQuantity(index)}
                        onFocusOut={(value) =>
                          handleQuantity(
                            index,
                            value,
                            purchase.buy_count >= 1 &&
                              purchase.buy_count <= purchase.product.quantity &&
                              value !== (purchasesInCart as Purchase[])[index].buy_count
                          )
                        }
                        disabled={false}
                        isQuantityInCart={true}
                      />

                      <div className='ml-auto flex items-center gap-1'>
                        <Button
                          size='sm'
                          animated={false}
                          onClick={handleSaveForLater(index)}
                          className='rounded-md p-1.5 text-blue-500 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                          aria-label={t('list.saveForLater')}
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.5}
                            stroke='currentColor'
                            className='h-5 w-5'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z'
                            />
                          </svg>
                        </Button>

                        <Button
                          size='sm'
                          animated={false}
                          onClick={handleDelete(index)}
                          className='rounded-md p-1.5 text-gray-500 transition-colors hover:text-[#ee4d2d] dark:text-gray-400'
                          aria-label={t('list.delete')}
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.5}
                            stroke='currentColor'
                            className='h-5 w-5'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'
                            />
                          </svg>
                        </Button>
                      </div>
                    </div>

                    <div className='mt-2 flex items-center justify-end'>
                      <span className='mr-2 text-sm text-gray-500 dark:text-gray-400'>
                        {t('summary.totalPayment')}:
                      </span>
                      <motion.span
                        className='font-medium text-[#ee4d2d]'
                        key={purchase.buy_count}
                        initial={{ scale: 0.9, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        ₫{formatCurrency(purchase.price * purchase.buy_count)}
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(CartItemList)
