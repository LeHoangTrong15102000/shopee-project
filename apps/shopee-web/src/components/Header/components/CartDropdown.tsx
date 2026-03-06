import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import Popover from 'src/components/Popover'
import { formatCurrency, generateNameId } from 'src/utils/utils'
import noproduct from 'src/assets/images/img-product-incart.png'
import path from 'src/constant/path'
import { Purchase } from 'src/types/purchases.type'

const MAX_PURCHASES = 5

interface CartDropdownProps {
  purchasesInCart: Purchase[] | undefined
  isAuthenticated: boolean
}

const CartDropdown = ({ purchasesInCart, isAuthenticated }: CartDropdownProps) => {
  const { t } = useTranslation('cart')
  return (
    <div className='flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 md:col-span-1 md:gap-3'>
      {/* Wishlist Icon */}
      <Link to={path.wishlist} className='text-white hover:text-white/80' aria-label={t('aria.wishlist')}>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='h-[22px] w-[22px] md:h-6 md:w-6'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z'
          />
        </svg>
      </Link>
      {/* Cart */}
      <div className='relative'>
        <Popover
          className=''
          renderPopover={
            <div className='relative max-w-[280px] rounded-xs border border-gray-200 bg-white text-sm shadow-md md:max-w-[400px] dark:border-slate-700 dark:bg-slate-800'>
              {purchasesInCart && purchasesInCart.length > 0 ? (
                <div className='p-[10px]'>
                  <div className='text-[rgba(0,0,0,.26)] capitalize dark:text-gray-400'>{t('dropdown.newlyAdded')}</div>
                  <div className='mt-5'>
                    {purchasesInCart.slice(0, MAX_PURCHASES).map((purchase) => (
                      <Link
                        to={`/${generateNameId({ name: purchase.product.name, id: purchase.product._id })}`}
                        className='mt-2 flex cursor-pointer py-2 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700'
                        key={purchase._id}
                      >
                        <div className='shrink-0'>
                          <img
                            src={purchase.product.image}
                            alt={purchase.product.name}
                            className='h-11 w-11 object-cover'
                          />
                        </div>
                        <div className='ml-2 grow overflow-hidden'>
                          <div className='truncate text-xs md:text-sm dark:text-gray-200'>{purchase.product.name}</div>
                        </div>
                        <div className='ml-2 shrink-0'>
                          <span className='text-xs text-[#ee4d2d] md:text-sm'>
                            ₫{formatCurrency(purchase.product.price)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className='mt-6 flex items-center justify-between text-gray-500 dark:text-gray-400'>
                    <div className='text-xs capitalize'>
                      {purchasesInCart.length > MAX_PURCHASES ? purchasesInCart.length - MAX_PURCHASES : ''}{' '}
                      {t('dropdown.moreItems')}
                    </div>
                    <Link
                      to={path.cart}
                      className='hover:bg-opacity-90 rounded-xs bg-[#ee4d2d] px-4 py-2 text-xs text-white capitalize md:text-sm'
                    >
                      {t('dropdown.viewCart')}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className='flex h-[200px] w-[280px] grow flex-col items-center justify-center p-2 md:h-[250px] md:w-[400px]'>
                  <img src={noproduct} alt='no purchase' className='h-16 w-16 md:h-24 md:w-24' />
                  <span className='mt-5 text-xs text-black/80 capitalize md:text-sm dark:text-gray-300'>
                    {t('dropdown.noProducts')}
                  </span>
                </div>
              )}
            </div>
          }
        >
          <Link to={isAuthenticated ? path.cart : path.login} className='relative text-white hover:text-white/80'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='currentColor'
              className='h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z'
              />
            </svg>
            {purchasesInCart && purchasesInCart?.length > 0 && (
              <span className='absolute top-[-0.3rem] right-[-0.6rem] min-w-2 rounded-[2.75rem] border-[0.125rem] border-[#ee4d2d] bg-white px-1 text-[11px] text-[#ee4d2d] md:top-[-0.4rem] md:right-[-0.8rem] md:min-w-2.75 md:px-[0.37rem] md:text-[13px]'>
                {purchasesInCart?.length}
              </span>
            )}
          </Link>
        </Popover>
      </div>
    </div>
  )
}

export default CartDropdown
