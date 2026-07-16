import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import NavHeader from '../NavHeader'
import { Link, useLocation, useNavigate } from 'react-router'
import path from 'src/constant/path'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import MobileNavigationDrawer from '../MobileNavigationDrawer'
import Button from 'src/components/Button'

interface CartHeaderProps {
  title?: string
  showStepper?: boolean
}

const CartHeader = ({ title, showStepper = true }: CartHeaderProps) => {
  const { t } = useTranslation('cart')
  const navigate = useNavigate()
  const { register, handleSubmit } = useForm<{ name: string }>({ defaultValues: { name: '' } })
  const onSubmitSearch = handleSubmit((data) => {
    navigate(`${path.products}?search=${encodeURIComponent(data.name)}`)
  })
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const displayTitle = title ?? t('header.title')
  return (
    <motion.div
      className="border-b border-b-black/10 dark:border-b-slate-700"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="hidden bg-orange text-white md:block">
        <div className="container">
          <NavHeader />
        </div>
      </div>
      <div className="h-auto min-h-16 border-b border-b-[rgba(0,0,0,.09)] bg-white py-3 md:h-25 md:py-6 dark:border-b-slate-700 dark:bg-slate-800">
        <div className="container">
          <nav className="flex items-center gap-2 sm:gap-4 md:justify-between md:gap-6">
            {/* Đường dẫn về trang chủ ShopHub, Logo ShopHub và tiêu đề mua hàng*/}
            <Link to={path.home} className="flex shrink-0 items-end">
              <div>
                <span className="text-xl font-bold text-orange sm:text-2xl md:text-3xl dark:text-orange-400">
                  ShopHub
                </span>
              </div>
              <div className="mx-2 h-5 border-r border-r-orange sm:mx-4 sm:h-6 md:h-8 dark:border-r-orange-400"></div>
              <motion.div
                className="text-sm font-normal text-orange capitalize sm:text-[15px] md:text-2xl dark:text-orange-400"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {displayTitle}
              </motion.div>
            </Link>
            {/* Bên dưới là form để search product */}
            <motion.form
              className="min-w-0 flex-1 md:w-[50%] md:flex-none"
              onSubmit={onSubmitSearch}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="flex rounded-xs border-2 border-orange dark:border-orange-400">
                <input
                  type="text"
                  className="w-full grow border-none bg-transparent px-2 py-2 text-xs text-[rgba(0,0,0,.95)] outline-hidden md:px-3 md:text-sm dark:text-gray-100"
                  placeholder={t('header.searchPlaceholder')}
                  {...register('name')}
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="primary"
                    animated={false}
                    type="submit"
                    className="shrink-0 rounded-xs bg-[linear-gradient(-180deg,#f53d2d,#f63)] px-4 py-2 hover:opacity-90 sm:px-5 sm:py-2 md:px-8"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5 stroke-white"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                  </Button>
                </motion.div>
              </div>
            </motion.form>
            {/* Hamburger menu button - mobile only (RIGHT side) */}
            <Button
              variant="icon"
              animated={false}
              onClick={() => setIsDrawerOpen(true)}
              className="shrink-0 p-1 text-orange hover:text-orange/70 md:hidden dark:text-orange-400"
              aria-label="Open navigation menu"
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
          </nav>
        </div>
      </div>
      {/* Shopping Flow Breadcrumb Bar */}
      {showStepper && <CartShoppingFlow />}
      {/* Mobile Navigation Drawer */}
      <MobileNavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </motion.div>
  )
}

/**
 * Shopping flow breadcrumb bar below the cart header.
 * Shows: Trang chủ > Giỏ hàng, plus a visual step indicator for the shopping journey.
 */
const CartShoppingFlow = () => {
  const { t } = useTranslation('cart')
  const location = useLocation()
  const SHOPPING_STEPS = [
    { label: t('steps.cart'), path: path.cart },
    { label: t('steps.checkout'), path: path.checkout },
    { label: t('steps.complete'), path: '' },
  ]

  // Determine current step based on route
  const currentStepIndex = SHOPPING_STEPS.findIndex(
    (step) => step.path && location.pathname === step.path,
  )
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0

  return (
    <motion.div
      className="border-b border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <div className="container flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between md:py-3">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs md:text-sm">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link
                to={path.home}
                className="text-gray-500 transition-colors hover:text-orange dark:text-gray-400"
              >
                {t('breadcrumb.home')}
              </Link>
            </li>
            <li>
              <span className="text-gray-300 dark:text-gray-600">/</span>
            </li>
            <li>
              <span className="font-medium text-gray-800 dark:text-gray-200" aria-current="page">
                {t('breadcrumb.cart')}
              </span>
            </li>
          </ol>
        </nav>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 md:gap-1.5">
          {SHOPPING_STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center">
              {index > 0 && (
                <div
                  className={`mx-0.5 h-[2px] w-6 transition-colors md:mx-1 md:w-10 ${
                    index <= activeStep
                      ? 'bg-orange dark:bg-orange-400'
                      : 'bg-gray-200 dark:bg-slate-600'
                  }`}
                />
              )}
              <div className="flex items-center gap-1">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium transition-colors md:h-6 md:w-6 md:text-xs ${
                    index <= activeStep
                      ? 'bg-orange text-white dark:bg-orange-500'
                      : 'bg-gray-200 text-gray-400 dark:bg-slate-600 dark:text-gray-400'
                  }`}
                >
                  {index < activeStep ? (
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-[10px] transition-colors md:text-xs ${
                    index <= activeStep
                      ? 'font-medium text-orange dark:text-orange-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default CartHeader
