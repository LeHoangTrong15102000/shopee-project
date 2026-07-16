import { Tooltip } from '@heroui/tooltip'
import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { AppContext } from 'src/contexts/app.context'
import Popover from '../Popover'
import authApi from 'src/apis/auth.api'
import { toast } from 'react-toastify'
import path from 'src/constant/path'

import { purchasesStatus } from 'src/constant/purchase'
import purchaseApi from 'src/apis/purchases.api'

import noproduct from 'src/assets/images/img-product-incart.png'
import { formatCurrency } from 'src/utils/utils'
import NavHeader from '../NavHeader'
import useSearchProducts from 'src/hooks/useSearchProducts'
import Button from 'src/components/Button'
const MAX_PURCHASES = 5

const Header1 = () => {
  const { t } = useTranslation('cart')
  const { setIsAuthenticated, isAuthenticated, setProfile } = useContext(AppContext)
  const queryClient = useQueryClient()
  const { onSubmitSearch, register } = useSearchProducts()

  // useQuery để gọi purchaseList hiển thị Cart product
  const { data: purchasesInCartData } = useQuery({
    queryKey: ['purchases', { status: purchasesStatus.inCart }],
    queryFn: () => purchaseApi.getPurchases({ status: purchasesStatus.inCart }),
    enabled: isAuthenticated, // chỉ gọi khi đã isAuthenticated
  })

  // console.log(purchasesInCartData)

  const purchasesInCart = purchasesInCartData?.data.data // PurchasesInCart là một cái Purchase[]
  // console.log(purchasesInCart)

  // useMutation để logout - giữ lại hook call cho side effects
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logoutAccount(),
    onSuccess: () => {
      setIsAuthenticated(false) // khi là false thì nó sẽ đá mình về trang /login
      setProfile(null)
      toast.success('Đăng xuất thành công', { autoClose: 1000 })
      // navigate('/login')
      queryClient.removeQueries({
        queryKey: ['purchases', { status: purchasesStatus.inCart }],
        exact: true,
      })
    },
  })

  return (
    <div className="bg-[linear-gradient(-180deg,#f53d2d,#f63)] pt-[4px] pb-[25px] text-white">
      <div className="container">
        {/* avatar User && thanh tools - Ẩn trên mobile */}
        <div className="hidden md:block">
          <NavHeader />
        </div>
        {/* grid chia 2 phần 1 logo ShopHub, 1 thanh search, 1 shop cart */}
        <div className="mt-2 grid grid-cols-12 items-end gap-2 md:mt-4 md:gap-4">
          {/* Icon ShopHub */}
          <Link to={path.home} className="col-span-2 md:col-span-2">
            <span className="text-2xl font-bold text-white lg:text-3xl">ShopHub</span>
          </Link>
          {/* search */}

          <form className="col-span-8 md:col-span-9" onSubmit={onSubmitSearch}>
            <Tooltip content={t('header.search', { ns: 'nav' })}>
              <div className="flex rounded-xs bg-white p-1 dark:bg-slate-800">
                <input
                  type="text"
                  className="grow border-none bg-transparent px-2 py-1.5 text-xs text-[rgba(0,0,0,.95)] outline-hidden md:px-3 md:py-2 md:text-sm dark:text-gray-100 dark:placeholder-gray-500"
                  placeholder={t('header.searchPlaceholder', { ns: 'nav' })}
                  {...register('name')}
                />
                {/* Nút tìm kiếm  */}

                <Button
                  animated={false}
                  type="submit"
                  className="shrink-0 rounded-xs bg-[linear-gradient(-180deg,#f53d2d,#f63)] px-4 py-1.5 hover:opacity-90 md:px-6 md:py-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </Button>
              </div>
            </Tooltip>
          </form>

          {/* Cart */}
          <div className="col-span-2 flex items-center justify-center md:col-span-1">
            {/* Ban đầu chưa có sản phẩm thì render ra biểu tượng */}
            <Popover
              className="relative flex items-center"
              renderPopover={
                <div className="relative max-w-[280px] rounded-xs border border-gray-200 bg-white text-sm shadow-md md:max-w-[400px] dark:border-slate-700 dark:bg-slate-800">
                  {purchasesInCart && purchasesInCart.length > 0 ? (
                    <div className="py-[10px] pl-[10px]">
                      <div className="text-[rgba(0,0,0,.26)] capitalize dark:text-gray-400">
                        {t('dropdown.newlyAdded')}
                      </div>
                      {/* danh sách hàng trong cart */}
                      <div className="mt-5">
                        {/* In PurchaseInCart trong giỏ hàng */}
                        {purchasesInCart.slice(0, MAX_PURCHASES).map((purchase) => (
                          // Danh mục các sản phẩm
                          <div
                            className="mt-2 flex py-2 pr-2 hover:bg-gray-100 dark:hover:bg-slate-700"
                            key={purchase._id}
                          >
                            {/* img product */}
                            <div className="shrink-0">
                              <img
                                className="h-10 w-10 object-cover"
                                src={purchase.product.image}
                                alt={purchase.product.name}
                              />
                            </div>
                            {/* tên product */}
                            <div className="ml-2 grow overflow-hidden">
                              <div className="truncate dark:text-gray-200">
                                {purchase.product.name}
                              </div>
                            </div>
                            {/* Giá */}
                            <div className="ml-2 shrink-0">
                              <span className="text-orange">
                                ₫{formatCurrency(purchase.product.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* số lượng hàng & button xem giỏ hàng */}
                      <div className="mt-6 flex items-center justify-between text-gray-500 dark:text-gray-400">
                        <div className="text-xs capitalize">
                          {purchasesInCart.length > MAX_PURCHASES
                            ? purchasesInCart.length - MAX_PURCHASES
                            : ''}{' '}
                          {t('dropdown.moreItems')}
                        </div>
                        <Link
                          to={path.cart}
                          className="hover:bg-opacity-90 rounded-xs bg-orange px-4 py-2 text-white capitalize"
                        >
                          {t('dropdown.viewCart')}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[200px] w-[280px] grow flex-col items-center justify-center p-2 md:h-[250px] md:w-[400px]">
                      <img src={noproduct} alt="no purchase" className="h-24 w-24" />
                      <span className="mt-5 text-black/80 capitalize dark:text-gray-300">
                        {t('dropdown.noProducts')}
                      </span>
                    </div>
                  )}
                </div>
              }
            >
              <Link
                to={path.cart}
                className="relative"
                aria-label={t('aria.cartItems', { count: purchasesInCart?.length || 0 })}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6 md:h-8 md:w-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
                {purchasesInCart && purchasesInCart?.length > 0 ? (
                  <span
                    aria-live="polite"
                    aria-atomic="true"
                    className="absolute top-[-0.4rem] right-[-0.8rem] min-w-2.75 rounded-[2.75rem] border-[0.125rem] border-orange bg-white px-[0.37rem] text-[13px] text-orange"
                  >
                    {purchasesInCart?.length}
                  </span>
                ) : (
                  ''
                )}
                {/* {purchasesInCart && purchasesInCart?.length > 0 && (
                  <span className='absolute top-[-0.4rem] right-[-0.8rem] min-w-2.75 rounded-[2.75rem] border-[0.125rem] border-[#ee4d2d] bg-white px-[0.56rem] text-xs text-[#ee4d2d]'>
                    {purchasesInCart?.length}
                  </span>
                )} */}
              </Link>
            </Popover>
            {/* <Link to='/'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='h-8 w-8'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z'
                />
              </svg>
            </Link> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header1
