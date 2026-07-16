import { useTranslation } from 'react-i18next'
import { Link, useMatch } from 'react-router'

const RegisterHeader = () => {
  const { t } = useTranslation('auth')
  const isRegister = Boolean(useMatch('/register'))
  return (
    <header className="bg-white py-2 md:py-5 dark:bg-slate-800">
      {/* container -> max-w-7xl mx-auto px-4 */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-4 md:px-8">
        {/* cái nav chứa cái brand của ShopHub và title gì đấy */}
        <nav className="flex items-end">
          <Link to="/">
            <span className="text-2xl font-bold text-orange sm:text-3xl md:text-4xl dark:text-orange-400">
              ShopHub
            </span>
          </Link>
          <div className="ml-2 text-base text-gray-900 sm:ml-4 sm:text-xl lg:text-2xl dark:text-gray-100">
            {isRegister ? t('register.title') : t('login.title')}
          </div>
        </nav>
        <Link
          to="/"
          className="flex min-h-[44px] items-center text-sm text-[#ee4d2d] sm:text-[15px] dark:text-orange-400"
        >
          {t('needHelp')}
        </Link>
      </div>
    </header>
  )
}

export default RegisterHeader
