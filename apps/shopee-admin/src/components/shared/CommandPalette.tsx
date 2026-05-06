import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
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
} from 'lucide-react'
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from 'src/components/ui/command'
import { useDebounce } from '@shopee/shared-utils'
import { useQuery } from '@tanstack/react-query'
import usersApi from 'src/apis/users.api'
import productsApi from 'src/apis/products.api'
import ordersApi from 'src/apis/orders.api'
import { PRODUCT_KEYS } from 'src/hooks/useProducts'
import { ORDER_KEYS } from 'src/hooks/useOrders'
import { USER_KEYS } from 'src/hooks/useUsers'
import type { Product, Order, User } from 'src/types'

const pages = [
  { titleKey: 'menu.overview', href: '/', icon: LayoutDashboard },
  { titleKey: 'menu.users', href: '/users', icon: Users },
  { titleKey: 'menu.products', href: '/products', icon: Package },
  { titleKey: 'menu.categories', href: '/categories', icon: FolderTree },
  { titleKey: 'menu.orders', href: '/orders', icon: ShoppingCart },
  { titleKey: 'menu.vouchers', href: '/vouchers', icon: Ticket },
  { titleKey: 'menu.reviews', href: '/reviews', icon: Star },
  { titleKey: 'menu.loyalty', href: '/loyalty', icon: Gift },
  { titleKey: 'menu.inventory', href: '/inventory', icon: Warehouse },
  { titleKey: 'menu.analytics', href: '/analytics', icon: BarChart3 },
  { titleKey: 'menu.notifications', href: '/notifications', icon: Bell },
  { titleKey: 'menu.qa', href: '/qa', icon: HelpCircle },
  { titleKey: 'menu.import', href: '/import', icon: Upload },
  { titleKey: 'menu.settings', href: '/settings', icon: Settings },
]

interface SearchResult {
  id: string
  label: string
  type: 'product' | 'order' | 'user'
  href: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation('layout')
  const { t: tc } = useTranslation('common')
  const debouncedQuery = useDebounce(query, 300)
  const prefersReducedMotion = useReducedMotion()

  const isSearchEnabled = open && debouncedQuery.length >= 2

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const { data: productsData } = useQuery({
    queryKey: [...PRODUCT_KEYS.all, 'search', debouncedQuery],
    queryFn: () => productsApi.getProducts({ name: debouncedQuery, limit: 5 }).then((r) => r.data.data),
    enabled: isSearchEnabled,
  })

  const { data: ordersData } = useQuery({
    queryKey: [...ORDER_KEYS.all, 'search', debouncedQuery],
    queryFn: () => ordersApi.getOrders({ search: debouncedQuery, limit: 5 }).then((r) => r.data.data),
    enabled: isSearchEnabled,
  })

  const { data: usersData } = useQuery({
    queryKey: [...USER_KEYS.all, 'search', debouncedQuery],
    queryFn: () => usersApi.getUsers({ search: debouncedQuery, limit: 5 }).then((r) => r.data.data),
    enabled: isSearchEnabled,
  })

  const results: SearchResult[] = isSearchEnabled
    ? [
        ...(productsData?.products ?? []).map((p: Product) => ({
          id: p._id,
          label: p.name,
          type: 'product' as const,
          href: `/products/${p._id}`,
        })),
        ...(ordersData?.orders ?? []).map((o: Order) => ({
          id: o._id,
          label: `Order #${o._id.slice(-8)}`,
          type: 'order' as const,
          href: `/orders/${o._id}`,
        })),
        ...(usersData?.items ?? []).map((u: User) => ({
          id: u._id,
          label: u.name || u.email,
          type: 'user' as const,
          href: `/users/${u._id}`,
        })),
      ]
    : []

  const select = (href: string) => {
    setOpen(false)
    setQuery('')
    navigate(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={prefersReducedMotion ? false : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' as const }}
          >
            <Command shouldFilter={!debouncedQuery || debouncedQuery.length < 2}>
              <CommandInput
                placeholder={tc('search.placeholder')}
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                <CommandEmpty>{tc('search.noResults')}</CommandEmpty>
                <CommandGroup heading={tc('search.pages')}>
                  {pages.map((p) => (
                    <CommandItem key={p.href} onSelect={() => select(p.href)}>
                      <p.icon className="mr-2 size-4" />
                      {t(p.titleKey)}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {results.length > 0 && (
                  <CommandGroup heading={tc('search.searchResults')}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </CommandDialog>
  )
}
