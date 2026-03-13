import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, Package, FolderTree, ShoppingCart,
  Ticket, Star, Gift, Warehouse, BarChart3, Bell, HelpCircle, Upload,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem,
} from 'src/components/ui/sidebar'

const navSections = [
  {
    label: 'Dashboard',
    items: [{ title: 'Overview', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Management',
    items: [
      { title: 'Users', href: '/users', icon: Users },
      { title: 'Products', href: '/products', icon: Package },
      { title: 'Categories', href: '/categories', icon: FolderTree },
      { title: 'Orders', href: '/orders', icon: ShoppingCart },
      { title: 'Vouchers', href: '/vouchers', icon: Ticket },
      { title: 'Reviews', href: '/reviews', icon: Star },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { title: 'Loyalty', href: '/loyalty', icon: Gift },
      { title: 'Inventory', href: '/inventory', icon: Warehouse },
      { title: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Notifications', href: '/notifications', icon: Bell },
      { title: 'Q&A', href: '/qa', icon: HelpCircle },
      { title: 'Import', href: '/import', icon: Upload },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Package className="size-6 text-primary" />
          <span className="group-data-[collapsible=icon]:hidden">Shopee Admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link to={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

