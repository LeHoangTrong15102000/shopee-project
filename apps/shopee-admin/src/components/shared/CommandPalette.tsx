import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from 'src/components/ui/command';
import { useDebounce } from '@shopee/shared-utils';
import usersApi from 'src/apis/users.api';
import productsApi from 'src/apis/products.api';
import ordersApi from 'src/apis/orders.api';

const pages = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Users', href: '/users', icon: Users },
  { title: 'Products', href: '/products', icon: Package },
  { title: 'Categories', href: '/categories', icon: FolderTree },
  { title: 'Orders', href: '/orders', icon: ShoppingCart },
  { title: 'Vouchers', href: '/vouchers', icon: Ticket },
  { title: 'Reviews', href: '/reviews', icon: Star },
  { title: 'Loyalty', href: '/loyalty', icon: Gift },
  { title: 'Inventory', href: '/inventory', icon: Warehouse },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
  { title: 'Notifications', href: '/notifications', icon: Bell },
  { title: 'Q&A', href: '/qa', icon: HelpCircle },
  { title: 'Import', href: '/import', icon: Upload },
  { title: 'Settings', href: '/settings', icon: Settings },
  { title: 'Activity Log', href: '/activity-log', icon: FileText },
];
interface SearchResult {
  id: string;
  label: string;
  type: 'product' | 'order' | 'user';
  href: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [products, orders, users] = await Promise.allSettled([
          productsApi.getProducts({ name: debouncedQuery, limit: 5 }).then((r) => r.data.data),
          ordersApi.getOrders({ search: debouncedQuery, limit: 5 }).then((r) => r.data.data),
          usersApi.getUsers({ search: debouncedQuery, limit: 5 }).then((r) => r.data.data),
        ]);
        if (cancelled) return;
        const items: SearchResult[] = [];
        if (products.status === 'fulfilled') {
          (products.value.products ?? []).forEach((p: any) =>
            items.push({ id: p._id, label: p.name, type: 'product', href: `/products/${p._id}` }),
          );
        }
        if (orders.status === 'fulfilled') {
          (orders.value.orders ?? []).forEach((o: any) =>
            items.push({
              id: o._id,
              label: `Order #${o._id.slice(-8)}`,
              type: 'order',
              href: `/orders/${o._id}`,
            }),
          );
        }
        if (users.status === 'fulfilled') {
          (users.value.items ?? []).forEach((u: any) =>
            items.push({
              id: u._id,
              label: u.name || u.email,
              type: 'user',
              href: `/users/${u._id}`,
            }),
          );
        }
        setResults(items);
      } catch {
        if (!cancelled) setResults([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const select = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      navigate(href);
    },
    [navigate],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command shouldFilter={!debouncedQuery || debouncedQuery.length < 2}>
        <CommandInput
          placeholder="Search pages or entities..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((p) => (
              <CommandItem key={p.href} onSelect={() => select(p.href)}>
                <p.icon className="mr-2 size-4" />
                {p.title}
              </CommandItem>
            ))}
          </CommandGroup>
          {results.length > 0 && (
            <CommandGroup heading="Search Results">
              {results.map((r) => (
                <CommandItem key={r.id} onSelect={() => select(r.href)}>
                  <span className="mr-2 text-xs text-muted-foreground capitalize">[{r.type}]</span>
                  {r.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
