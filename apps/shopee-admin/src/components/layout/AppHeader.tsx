import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, LogOut, Settings, Globe, Check } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { SidebarTrigger } from 'src/components/ui/sidebar';
import { Separator } from 'src/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'src/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from 'src/components/ui/avatar';
import { useAuthStore } from 'src/stores/auth.store';
import { useThemeStore } from 'src/stores/theme.store';
import { locales, changeLanguage } from 'src/i18n/i18n';

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
};

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('layout');
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const segments = location.pathname.split('/').filter(Boolean);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRouteLabel = (seg: string) => {
    const key = routeLabelKeys[seg];
    return key ? t(key) : seg;
  };

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? 'AD');

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
            <Globe className="size-4" />
            <span className="hidden sm:inline text-xs">
              {locales[i18n.language as keyof typeof locales] ?? i18n.language}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.entries(locales) as [string, string][]).map(([code, label]) => (
              <DropdownMenuItem key={code} onClick={() => changeLanguage(code)}>
                {i18n.language === code && <Check className="mr-2 size-4" />}
                {i18n.language !== code && <span className="mr-2 size-4" />}
                {label}
              </DropdownMenuItem>
            ))}
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
  );
}
