import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRef, useEffect, useCallback, type ComponentType } from 'react'
import { motion, useReducedMotion } from 'motion/react'
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
  MessageSquare,
  Truck,
  CreditCard,
  TrendingUp,
  CheckSquare,
  Store,
  Activity,
  Search,
  Heart,
  MessagesSquare,
  ScrollText,
} from 'lucide-react'
import { ROUTES } from 'src/constants/routes'
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
} from 'src/components/ui/sidebar'
import { useNotificationUnreadCount } from 'src/hooks/useNotifications'
import { SHORTCUT_ROUTES } from 'src/hooks/use-keyboard-shortcuts'

const navSections = [
  {
    labelKey: 'sections.dashboard',
    items: [{ titleKey: 'menu.overview', href: ROUTES.DASHBOARD, icon: LayoutDashboard }],
  },
  {
    labelKey: 'sections.management',
    items: [
      { titleKey: 'menu.users', href: ROUTES.USERS, icon: Users },
      { titleKey: 'menu.products', href: ROUTES.PRODUCTS, icon: Package },
      { titleKey: 'menu.categories', href: ROUTES.CATEGORIES, icon: FolderTree },
      { titleKey: 'menu.orders', href: ROUTES.ORDERS, icon: ShoppingCart },
      { titleKey: 'menu.vouchers', href: ROUTES.VOUCHERS, icon: Ticket },
      { titleKey: 'menu.reviews', href: ROUTES.REVIEWS, icon: Star },
      { titleKey: 'menu.shops', href: ROUTES.SHOPS, icon: Store },
    ],
  },
  {
    labelKey: 'sections.advanced',
    items: [
      { titleKey: 'menu.loyalty', href: ROUTES.LOYALTY, icon: Gift },
      { titleKey: 'menu.inventory', href: ROUTES.INVENTORY, icon: Warehouse },
      { titleKey: 'menu.analytics', href: ROUTES.ANALYTICS, icon: BarChart3 },
      { titleKey: 'menu.searchAnalytics', href: ROUTES.SEARCH_ANALYTICS, icon: Search },
      { titleKey: 'menu.wishlistAnalytics', href: ROUTES.WISHLIST_ANALYTICS, icon: Heart },
    ],
  },
  {
    labelKey: 'sections.system',
    items: [
      { titleKey: 'menu.notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
      { titleKey: 'menu.qa', href: ROUTES.QA, icon: HelpCircle },
      { titleKey: 'menu.conversations', href: ROUTES.CONVERSATIONS, icon: MessageSquare },
      { titleKey: 'menu.shopChat', href: ROUTES.SHOP_CHAT, icon: MessagesSquare },
      { titleKey: 'menu.import', href: ROUTES.IMPORT, icon: Upload },
      { titleKey: 'menu.settings', href: ROUTES.SETTINGS, icon: Settings },
      { titleKey: 'menu.shippingMethods', href: ROUTES.SHIPPING_METHODS, icon: Truck },
      { titleKey: 'menu.paymentMethods', href: ROUTES.PAYMENT_METHODS, icon: CreditCard },
      { titleKey: 'menu.priceAlerts', href: ROUTES.PRICE_ALERTS, icon: TrendingUp },
      { titleKey: 'menu.checkin', href: ROUTES.CHECKIN, icon: CheckSquare },
      { titleKey: 'menu.systemHealth', href: ROUTES.SYSTEM_HEALTH, icon: Activity },
      { titleKey: 'menu.activityLog', href: ROUTES.AUDIT_LOG, icon: ScrollText },
    ],
  },
]

const routePrefetchMap: Record<string, () => Promise<unknown>> = {
  [ROUTES.DASHBOARD]: () => import('src/pages/Dashboard/DashboardPage'),
  [ROUTES.USERS]: () => import('src/pages/Users/UserListPage'),
  [ROUTES.PRODUCTS]: () => import('src/pages/Products/ProductListPage'),
  [ROUTES.CATEGORIES]: () => import('src/pages/Categories/CategoryListPage'),
  [ROUTES.ORDERS]: () => import('src/pages/Orders/OrderListPage'),
  [ROUTES.VOUCHERS]: () => import('src/pages/Vouchers/VoucherListPage'),
  [ROUTES.REVIEWS]: () => import('src/pages/Reviews/ReviewListPage'),
  [ROUTES.LOYALTY]: () => import('src/pages/Loyalty/LoyaltyPage'),
  [ROUTES.INVENTORY]: () => import('src/pages/Inventory/InventoryPage'),
  [ROUTES.ANALYTICS]: () => import('src/pages/Analytics/AnalyticsPage'),
  [ROUTES.NOTIFICATIONS]: () => import('src/pages/Notifications/NotificationListPage'),
  [ROUTES.QA]: () => import('src/pages/QA/QAPage'),
  [ROUTES.IMPORT]: () => import('src/pages/Import/ImportPage'),
  [ROUTES.SETTINGS]: () => import('src/pages/Settings/SettingsPage'),
  [ROUTES.CONVERSATIONS]: () => import('src/pages/Conversations/ConversationListPage'),
  [ROUTES.SHIPPING_METHODS]: () => import('src/pages/Shipping/ShippingMethodsPage'),
  [ROUTES.PAYMENT_METHODS]: () => import('src/pages/Payments/PaymentMethodsPage'),
  [ROUTES.PRICE_ALERTS]: () => import('src/pages/PriceAlerts/PriceAlertsPage'),
  [ROUTES.CHECKIN]: () => import('src/pages/Checkin/CheckinPage'),
  [ROUTES.SHOPS]: () => import('src/pages/Shops/ShopListPage'),
  [ROUTES.SYSTEM_HEALTH]: () => import('src/pages/SystemHealth/SystemHealthPage'),
  [ROUTES.SEARCH_ANALYTICS]: () => import('src/pages/SearchAnalytics/SearchAnalyticsPage'),
  [ROUTES.WISHLIST_ANALYTICS]: () => import('src/pages/WishlistAnalytics/WishlistAnalyticsPage'),
  [ROUTES.SHOP_CHAT]: () => import('src/pages/ShopChat/ShopChatListPage'),
  [ROUTES.AUDIT_LOG]: () => import('src/pages/AuditLog/AuditLogListPage'),
}

const prefetchedRoutes = new Set<string>()

const BRAND_COLOR = 'oklch(0.642 0.203 33)'
const STROKE_DRAW_DURATION = 800

type StrokableElement =
  | SVGPathElement
  | SVGLineElement
  | SVGCircleElement
  | SVGRectElement
  | SVGEllipseElement
  | SVGPolylineElement
  | SVGPolygonElement

function isStrokable(el: SVGElement): el is StrokableElement {
  return 'getTotalLength' in el && typeof (el as StrokableElement).getTotalLength === 'function'
}

function AnimatedIcon({
  icon: Icon,
  isActive,
  className,
}: {
  icon: ComponentType<{ className?: string; ref?: React.Ref<SVGSVGElement> }>
  isActive: boolean
  className?: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const hasAnimated = useRef(false)

  const animate = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    const children = svg.querySelectorAll<SVGElement>(
      'path, line, circle, rect, ellipse, polyline, polygon',
    )
    if (children.length === 0) return

    children.forEach((child) => {
      if (!isStrokable(child)) return
      const length = child.getTotalLength()

      child.style.stroke = BRAND_COLOR
      child.style.strokeDasharray = `${length}`
      child.style.strokeDashoffset = `${length}`
      child.style.transition = 'none'

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          child.style.transition = `stroke-dashoffset ${STROKE_DRAW_DURATION}ms ease-out`
          child.style.strokeDashoffset = '0'
        })
      })
    })

    hasAnimated.current = true
  }, [])

  useEffect(() => {
    if (isActive && !hasAnimated.current) {
      const frame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(frame)
    }
    if (!isActive) {
      hasAnimated.current = false
      const svg = svgRef.current
      if (svg) {
        const children = svg.querySelectorAll<SVGElement>(
          'path, line, circle, rect, ellipse, polyline, polygon',
        )
        children.forEach((child) => {
          child.style.stroke = ''
          child.style.strokeDasharray = ''
          child.style.strokeDashoffset = ''
          child.style.transition = ''
        })
      }
    }
  }, [isActive, animate])

  return <Icon ref={svgRef} className={className} />
}

export function AppSidebar() {
  const location = useLocation()
  const { t } = useTranslation('layout')
  const { data: unreadCount } = useNotificationUnreadCount()
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const prefersReducedMotion = useReducedMotion()

  const handlePrefetch = (href: string) => {
    if (prefetchedRoutes.has(href) || !routePrefetchMap[href]) return
    prefetchTimerRef.current = setTimeout(() => {
      prefetchedRoutes.add(href)
      routePrefetchMap[href]().catch(() => {
        prefetchedRoutes.delete(href)
      })
    }, 200)
  }

  const cancelPrefetch = () => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current)
      prefetchTimerRef.current = null
    }
  }

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
                    const title = t(item.titleKey)
                    const isActive =
                      item.href === ROUTES.DASHBOARD
                        ? location.pathname === ROUTES.DASHBOARD
                        : location.pathname.startsWith(item.href)
                    const idx = (SHORTCUT_ROUTES as readonly string[]).indexOf(item.href)
                    const hint = idx !== -1 ? `⌥${idx + 1}` : null
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
                          {!isActive && !prefersReducedMotion ? (
                            <motion.span
                              className="flex items-center gap-2 w-full"
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                              <AnimatedIcon
                                icon={item.icon}
                                isActive={isActive}
                                className="size-4"
                              />
                              <span>{title}</span>
                              {hint && (
                                <kbd className="ml-auto text-[10px] text-muted-foreground opacity-60 group-data-[collapsible=icon]:hidden">
                                  {hint}
                                </kbd>
                              )}
                            </motion.span>
                          ) : (
                            <>
                              <AnimatedIcon
                                icon={item.icon}
                                isActive={isActive}
                                className="size-4"
                              />
                              <span>{title}</span>
                              {hint && (
                                <kbd className="ml-auto text-[10px] text-muted-foreground opacity-60 group-data-[collapsible=icon]:hidden">
                                  {hint}
                                </kbd>
                              )}
                            </>
                          )}
                        </SidebarMenuButton>
                        {item.titleKey === 'menu.notifications' &&
                          !!unreadCount &&
                          unreadCount > 0 && <SidebarMenuBadge>{unreadCount}</SidebarMenuBadge>}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
    </Sidebar>
  )
}
