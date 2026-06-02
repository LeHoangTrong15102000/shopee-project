import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Store, Package, Users, Star, DollarSign, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from 'src/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { Label } from 'src/components/ui/label'
import { Textarea } from 'src/components/ui/textarea'
import { Skeleton } from 'src/components/ui/skeleton'
import { Badge } from 'src/components/ui/badge'
import { StatCard } from 'src/components/shared/StatCard'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { ErrorState } from 'src/components/shared/ErrorState'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import shopsApi from 'src/apis/shops.api'
import type { ShopStatus, UpdateShopStatusBody } from 'src/types/shop.types'
import { formatPrice } from '@shopee/shared-utils'
import { ROUTES } from 'src/constants/routes'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ColumnDef } from '@tanstack/react-table'
import type { Product } from 'src/types'

const SHOP_STATUS_OPTIONS: ShopStatus[] = ['pending', 'active', 'suspended', 'banned']

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('shops')
  const { t: tc } = useTranslation('common')
  const queryClient = useQueryClient()

  const [revenuePeriod, setRevenuePeriod] = useState('30d')
  const [productsPage, setProductsPage] = useState(0)
  const [statusDialog, setStatusDialog] = useState<ShopStatus | null>(null)
  const [statusReason, setStatusReason] = useState('')

  const {
    data: shop,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-shop-detail', id],
    queryFn: () => shopsApi.getAdminShopDetail(id!).then((r) => r.data.data),
    enabled: !!id,
  })

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-shop-products', id, productsPage],
    queryFn: () =>
      shopsApi.getShopProducts(id!, { page: productsPage + 1, limit: 20 }).then((r) => r.data.data),
    enabled: !!id,
  })

  const { data: revenue } = useQuery({
    queryKey: ['admin-shop-revenue', id, revenuePeriod],
    queryFn: () => shopsApi.getShopRevenue(id!, revenuePeriod).then((r) => r.data.data),
    enabled: !!id,
  })

  const updateStatusMut = useMutation({
    mutationFn: (body: UpdateShopStatusBody) => shopsApi.updateShopStatus(id!, body),
    onSuccess: () => {
      toast.success(t('statusUpdated'))
      queryClient.invalidateQueries({ queryKey: ['admin-shop-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      setStatusDialog(null)
      setStatusReason('')
    },
    onError: () => toast.error(tc('states.somethingWentWrong')),
  })

  const confirmStatusChange = () => {
    if (!statusDialog) return
    const needsReason = statusDialog === 'suspended' || statusDialog === 'banned'
    if (needsReason && !statusReason.trim()) return
    updateStatusMut.mutate({ status: statusDialog, reason: statusReason.trim() || undefined })
  }

  const productColumns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: t('detail.products.columns.name'),
      cell: ({ row }) => (
        <span className="font-medium text-sm line-clamp-1">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'price',
      header: t('detail.products.columns.price'),
      cell: ({ row }) => formatPrice(row.original.price),
    },
    {
      accessorKey: 'quantity',
      header: t('detail.products.columns.stock'),
      cell: ({ row }) => row.original.quantity?.toLocaleString() ?? '—',
    },
    {
      accessorKey: 'sold',
      header: t('detail.products.columns.sold'),
      cell: ({ row }) => row.original.sold?.toLocaleString() ?? '—',
    },
  ]

  if (isError) return <ErrorState message={t('error')} onRetry={refetch} />

  const needsReason = statusDialog === 'suspended' || statusDialog === 'banned'

  return (
    <div className="space-y-6">
      <PageHeader
        title={isLoading ? '...' : (shop?.name ?? '')}
        description={t('detail.description')}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.SHOPS)}>
            <ArrowLeft className="mr-2 size-4" />
            {tc('buttons.back')}
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      ) : shop ? (
        <>
          {/* Shop profile header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <Avatar className="size-20">
                  <AvatarImage src={shop.avatar} alt={shop.name} />
                  <AvatarFallback className="text-2xl">
                    <Store className="size-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold">{shop.name}</h2>
                    <StatusBadge status={shop.status} />
                  </div>
                  {shop.description && (
                    <p className="text-sm text-muted-foreground">{shop.description}</p>
                  )}
                  {shop.status_reason && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                      <ShieldAlert className="size-4 shrink-0" />
                      <span>{shop.status_reason}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('detail.joined')}: {format(new Date(shop.joinedDate), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {SHOP_STATUS_OPTIONS.filter((s) => s !== shop.status).map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusDialog(s)
                        setStatusReason('')
                      }}
                    >
                      {t(`actions.setStatus.${s}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('detail.stats.products')}
              value={shop.stats.products_count}
              icon={<Package className="size-4" />}
            />
            <StatCard
              label={t('detail.stats.revenue')}
              value={shop.stats.total_revenue}
              formatter={formatPrice}
              icon={<DollarSign className="size-4" />}
            />
            <StatCard
              label={t('detail.stats.followers')}
              value={shop.stats.followers_count}
              icon={<Users className="size-4" />}
            />
            <StatCard
              label={t('detail.stats.rating')}
              value={shop.stats.avg_rating}
              formatter={(v) => Number(v).toFixed(1)}
              icon={<Star className="size-4" />}
            />
          </div>

          {/* Tabbed content */}
          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">{t('detail.tabs.products')}</TabsTrigger>
              <TabsTrigger value="revenue">{t('detail.tabs.revenue')}</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-4">
              <DataTable
                columns={productColumns}
                data={products?.items ?? []}
                isLoading={loadingProducts}
                pageIndex={productsPage}
                pageCount={products?.pagination.total_pages ?? 1}
                onPaginationChange={(page) => setProductsPage(page)}
                totalRows={products?.pagination.total ?? 0}
                manualPagination
              />
            </TabsContent>

            <TabsContent value="revenue" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('detail.revenue.title')}</CardTitle>
                  <Select
                    value={revenuePeriod}
                    onValueChange={(val) => val !== null && setRevenuePeriod(val)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7d</SelectItem>
                      <SelectItem value="30d">30d</SelectItem>
                      <SelectItem value="90d">90d</SelectItem>
                      <SelectItem value="1y">1y</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenue?.data ?? []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => formatPrice(v)} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => formatPrice(Number(v))} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.1)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      {/* Status change dialog */}
      <Dialog
        open={!!statusDialog}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialog(null)
            setStatusReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('statusDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {t('statusDialog.description', {
                shop: shop?.name,
                status: statusDialog ? tc(`statuses.${statusDialog}`) : '',
              })}
            </p>
            {needsReason && (
              <div className="space-y-2">
                <Label htmlFor="status-reason-detail">{t('statusDialog.reason')}</Label>
                <Textarea
                  id="status-reason-detail"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={t('statusDialog.reasonPlaceholder')}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialog(null)
                setStatusReason('')
              }}
            >
              {tc('buttons.cancel')}
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={updateStatusMut.isPending || (needsReason && !statusReason.trim())}
            >
              {tc('buttons.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
