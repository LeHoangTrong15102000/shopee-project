import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Moon, Sun, LogOut, Settings, Check } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { SidebarTrigger } from 'src/components/ui/sidebar'
import { Separator } from 'src/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'src/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from 'src/components/ui/avatar'
import { useAuthStore } from 'src/stores/auth.store'
import { useThemeStore } from 'src/stores/theme.store'
import { locales, changeLanguage } from 'src/i18n/i18n'

function FlagIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[18px] w-[27px] shrink-0 items-center justify-center overflow-hidden rounded-sm">
      {children}
    </span>
  )
}

function FlagGB() {
  return (
    <FlagIcon>
      <svg className="size-full" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
        <clipPath id="gb">
          <path d="M0 0v20h30V0z" />
        </clipPath>
        <g clipPath="url(#gb)">
          <path fill="#012169" d="M0 0v20h30V0z" />
          <path stroke="#fff" strokeWidth="4" d="M0 0l30 20m0-20L0 20" />
          <path stroke="#C8102E" strokeWidth="2.5" d="M0 0l30 20m0-20L0 20" clipPath="url(#gb)" />
          <path stroke="#fff" strokeWidth="6.67" d="M15 0v20M0 10h30" />
          <path stroke="#C8102E" strokeWidth="4" d="M15 0v20M0 10h30" />
        </g>
      </svg>
    </FlagIcon>
  )
}

function FlagVN() {
  return (
    <FlagIcon>
      <svg className="size-full" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
        <rect fill="#da251d" width="30" height="20" />
        <polygon
          fill="#ff0"
          points="15,4 16.35,8.15 20.71,8.15 17.18,10.71 18.53,14.85 15,12.29 11.47,14.85 12.82,10.71 9.29,8.15 13.65,8.15"
        />
      </svg>
    </FlagIcon>
  )
}

const languageFlags: Record<string, React.ComponentType> = {
  en: FlagGB,
  vi: FlagVN,
}

const routeLabelKeys: Record<string, string> = {
  '': 'menu.overview',
  users: 'menu.users',
  products: 'menu.products',
  categories: 'menu.categories',
  orders: 'menu.orders',
  vouchers: 'menu.vouchers',
  reviews: 'menu.reviews',
  loyalty: 'menu.loyalty',
  inventory: 'menu.inventory',
  analytics: 'menu.analytics',
  notifications: 'menu.notifications',
  qa: 'menu.qa',
  import: 'menu.import',
  settings: 'menu.settings',
  'activity-log': 'menu.activityLog',
}

export function AppHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation('layout')
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()

  const segments = location.pathname.split('/').filter(Boolean)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const getRouteLabel = (seg: string) => {
    const key = routeLabelKeys[seg]
    return key ? t(key) : seg
  }

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? 'AD')

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap overflow-x-auto no-scrollbar">
          <BreadcrumbItem>
            {segments.length === 0 ? (
              <BreadcrumbPage>{t('breadcrumb.dashboard')}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink href="/">{t('breadcrumb.dashboard')}</BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {segments.map((seg, i) => (
            <BreadcrumbItem key={seg}>
              <BreadcrumbSeparator />
              {i === segments.length - 1 ? (
                <BreadcrumbPage className="truncate">{getRouteLabel(seg)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/${segments.slice(0, i + 1).join('/')}`}>
                  {getRouteLabel(seg)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={t('header.toggleTheme')}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                aria-label={t('header.changeLanguage')}
              />
            }
          >
            {(() => {
              const CurrentFlag = languageFlags[i18n.language]
              return CurrentFlag ? <CurrentFlag /> : <span className="h-[18px] w-[27px]" />
            })()}
            <span className="hidden sm:inline text-xs">
              {locales[i18n.language as keyof typeof locales] ?? i18n.language}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {(Object.entries(locales) as [string, string][]).map(([code, label]) => {
              const Flag = languageFlags[code]
              return (
                <DropdownMenuItem key={code} onClick={() => changeLanguage(code)} className="gap-2">
                  {Flag && <Flag />}
                  <span className="flex-1">{label}</span>
                  {i18n.language === code && <Check className="size-4 shrink-0" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-2" />}>
            <Avatar className="size-6">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{user?.name || user?.email}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name || t('header.admin')}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 size-4" /> {t('header.settings')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 size-4" /> {t('header.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
