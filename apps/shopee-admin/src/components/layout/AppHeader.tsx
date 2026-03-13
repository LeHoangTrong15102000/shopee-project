import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut } from 'lucide-react';
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

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  users: 'Users',
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  vouchers: 'Vouchers',
  reviews: 'Reviews',
  loyalty: 'Loyalty',
  inventory: 'Inventory',
  analytics: 'Analytics',
  notifications: 'Notifications',
  qa: 'Q&A',
  import: 'Import',
};

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const segments = location.pathname.split('/').filter(Boolean);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? 'AD');

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {segments.length === 0 ? (
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            ) : (
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {segments.map((seg, i) => (
            <BreadcrumbItem key={seg}>
              <BreadcrumbSeparator />
              {i === segments.length - 1 ? (
                <BreadcrumbPage>{routeLabels[seg] ?? seg}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/${segments.slice(0, i + 1).join('/')}`}>
                  {routeLabels[seg] ?? seg}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="size-6">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">{user?.name || user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 size-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
