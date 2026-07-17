import { useQuery } from '@tanstack/react-query'
import { useContext, useState } from 'react'
import { Link } from 'react-router'
import { AppContext } from 'src/contexts/app.context'
import path from 'src/constant/path'
import { purchasesStatus } from 'src/constant/purchase'
import purchaseApi from 'src/apis/purchases.api'
import NavHeader from '../NavHeader'
import { useProductQueryStates } from 'src/hooks/nuqs'
import { SearchBar, CartDropdown } from './components'
import MobileNavigationDrawer from '../MobileNavigationDrawer'
import Button from 'src/components/Button'

const Header = () => {
  const [filters, setFilters] = useProductQueryStates()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { isAuthenticated } = useContext(AppContext)

  // useQuery để gọi purchaseList hiển thị Cart product
  const { data: purchasesInCartData } = useQuery({
    queryKey: ['purchases', { status: purchasesStatus.inCart }],
    queryFn: () => purchaseApi.getPurchases({ status: purchasesStatus.inCart }),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const purchasesInCart = purchasesInCartData?.data.data

  return (
    <div className="bg-[linear-gradient(-180deg,#f53d2d,#f63)] pt-[4px] pb-3 text-white md:pb-[25px]">
      <div className="container">
        {/* NavHeader - Full version on desktop only */}
        <div className="hidden md:block">
          <NavHeader />
        </div>

        {/* Desktop: grid layout - logo + search + cart */}
        <div className="mt-4 hidden grid-cols-12 items-end gap-4 md:grid">
          {/* Logo ShopHub */}
          <Link to={path.home} className="col-span-2">
            <span className="text-2xl font-bold text-white">ShopHub</span>
          </Link>

          {/* Search */}
          <div className="col-span-8">
            <SearchBar filters={filters} setFilters={setFilters} />
          </div>

          {/* Cart */}
          <div className="col-span-2 flex items-center justify-center">
            <CartDropdown purchasesInCart={purchasesInCart} isAuthenticated={isAuthenticated} />
          </div>
        </div>

        {/* Mobile: logo + search + hamburger */}
        <div className="flex items-center gap-3 py-2 md:hidden">
          {/* ShopHub logo */}
          <Link to={path.home} className="flex shrink-0 items-end gap-1">
            <span className="text-xl font-bold text-white">ShopHub</span>
          </Link>
          {/* Search bar */}
          <div className="min-w-0 flex-1">
            <SearchBar filters={filters} setFilters={setFilters} />
          </div>
          {/* Hamburger menu button */}
          <Button
            variant="icon"
            animated={false}
            onClick={() => setIsDrawerOpen(true)}
            className="shrink-0 p-1 hover:text-white/70"
            ariaLabel="Open navigation menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </Button>
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileNavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      </div>
    </div>
  )
}

export default Header
