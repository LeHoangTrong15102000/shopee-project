import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  Ticket,
  Star,
  Gift,
  Warehouse,
  BarChart3,
  Bell,
  HelpCircle,
  Upload,
  Settings,
  FileText,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from 'src/components/ui/sidebar';
import { useNotificationUnreadCount } from 'src/hooks/useNotifications';
import { SHORTCUT_ROUTES } from 'src/hooks/use-keyboard-shortcuts';

const navSections = [
  {
    labelKey: 'sections.dashboard',
    items: [{ titleKey: 'menu.overview', href: '/', icon: LayoutDashboard }],
  },
  {
    labelKey: 'sections.management',
    items: [
      { titleKey: 'menu.users', href: '/users', icon: Users },
      { titleKey: 'menu.products', href: '/products', icon: Package },
      { titleKey: 'menu.categories', href: '/categories', icon: FolderTree },
      { titleKey: 'menu.orders', href: '/orders', icon: ShoppingCart },
      { titleKey: 'menu.vouchers', href: '/vouchers', icon: Ticket },
      { titleKey: 'menu.reviews', href: '/reviews', icon: Star },
    ],
  },
  {
    labelKey: 'sections.advanced',
    items: [
      { titleKey: 'menu.loyalty', href: '/loyalty', icon: Gift },
      { titleKey: 'menu.inventory', href: '/inventory', icon: Warehouse },
      { titleKey: 'menu.analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    labelKey: 'sections.system',
    items: [
      { titleKey: 'menu.notifications', href: '/notifications', icon: Bell },
      { titleKey: 'menu.qa', href: '/qa', icon: HelpCircle },
      { titleKey: 'menu.import', href: '/import', icon: Upload },
      { titleKey: 'menu.settings', href: '/settings', icon: Settings },
      { titleKey: 'menu.activityLog', href: '/activity-log', icon: FileText },
    ],
  },
];

const routePrefetchMap: Record<string, () => Promise<unknown>> = {
  '/': () => import('src/pages/Dashboard/DashboardPage'),
  '/users': () => import('src/pages/Users/UserListPage'),
  '/products': () => import('src/pages/Products/ProductListPage'),
  '/categories': () => import('src/pages/Categories/CategoryListPage'),
  '/orders': () => import('src/pages/Orders/OrderListPage'),
  '/vouchers': () => import('src/pages/Vouchers/VoucherListPage'),
  '/reviews': () => import('src/pages/Reviews/ReviewListPage'),
  '/loyalty': () => import('src/pages/Loyalty/LoyaltyPage'),
  '/inventory': () => import('src/pages/Inventory/InventoryPage'),
  '/analytics': () => import('src/pages/Analytics/AnalyticsPage'),
  '/notifications': () => import('src/pages/Notifications/NotificationListPage'),
  '/qa': () => import('src/pages/QA/QAPage'),
  '/import': () => import('src/pages/Import/ImportPage'),
  '/settings': () => import('src/pages/Settings/SettingsPage'),
  '/activity-log': () => import('src/pages/ActivityLog/ActivityLogPage'),
};

const prefetchedRoutes = new Set<string>();

export function AppSidebar() {
  const location = useLocation();
  const { t } = useTranslation('layout');
  const { data: unreadCount } = useNotificationUnreadCount();
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handlePrefetch = (href: string) => {
    if (prefetchedRoutes.has(href) || !routePrefetchMap[href]) return;
    prefetchTimerRef.current = setTimeout(() => {
      prefetchedRoutes.add(href);
      routePrefetchMap[href]().catch(() => {
        prefetchedRoutes.delete(href);
      });
    }, 200);
  };

  const cancelPrefetch = () => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = null;
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Package className="size-6 text-primary" />
          <span className="group-data-[collapsible=icon]:hidden">{t('brand')}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={t('sidebar.mainNavigation')}>
          {navSections.map((section) => (
            <SidebarGroup key={section.labelKey}>
              <SidebarGroupLabel>{t(section.labelKey)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const title = t(item.titleKey);
                    const isActive =
                      item.href === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.href);
                    const idx = SHORTCUT_ROUTES.indexOf(item.href);
                    const hint = idx !== -1 ? `⌥${idx + 1}` : null;
                    return (
                      <SidebarMenuItem
                        key={item.href}
                        onMouseEnter={() => handlePrefetch(item.href)}
                        onMouseLeave={cancelPrefetch}
                      >
                        <SidebarMenuButton
                          render={<Link to={item.href} />}
                          isActive={isActive}
                          tooltip={title}
                        >
                          <item.icon className="size-4" />
                          <span>{title}</span>
                          {hint && (
                            <kbd className="ml-auto text-[10px] text-muted-foreground opacity-60 group-data-[collapsible=icon]:hidden">
                              {hint}
                            </kbd>
                          )}
                        </SidebarMenuButton>
                        {item.titleKey === 'menu.notifications' &&
                          !!unreadCount &&
                          unreadCount > 0 && <SidebarMenuBadge>{unreadCount}</SidebarMenuBadge>}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}
