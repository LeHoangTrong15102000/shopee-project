import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowLeft, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Avatar, AvatarFallback } from 'src/components/ui/avatar'
import { Badge } from 'src/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ErrorState } from 'src/components/shared/ErrorState'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import usersApi from 'src/apis/users.api'
import ordersApi from 'src/apis/orders.api'
import reviewsApi from 'src/apis/reviews.api'
import loyaltyApi from 'src/apis/loyalty.api'
import type { Order, Review, LoyaltyTransaction } from 'src/types'
import type { Address } from 'src/types/address.types'

export default function UserDetailPage() {
  const { t } = useTranslation('users')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('orders')

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => usersApi.getUser(id!).then((r) => r.data.data),
    enabled: !!id,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['admin-user-orders', id],
    queryFn: () => ordersApi.getOrders({ user_id: id, limit: 50 }).then((r) => r.data.data),
    enabled: !!id && activeTab === 'orders',
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['admin-user-reviews', id],
    queryFn: () => reviewsApi.getReviews({ user_id: id, limit: 50 }).then((r) => r.data.data),
    enabled: !!id && activeTab === 'reviews',
  })

  const { data: loyaltyData } = useQuery({
    queryKey: ['admin-user-loyalty', id],
    queryFn: () => loyaltyApi.getTransactions({ user_id: id, limit: 50 }).then((r) => r.data.data),
    enabled: !!id && activeTab === 'loyalty',
  })

  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['admin-user-addresses', id],
    queryFn: () => usersApi.getUserAddresses(id!).then((r) => r.data.data),
    enabled: !!id && activeTab === 'addresses',
  })

  const orderColumns: ColumnDef<Order>[] = [
    {
      accessorKey: '_id',
      header: t('detail.orderId'),
      cell: ({ row }) => row.original._id.slice(-8),
    },
    {
      accessorKey: 'total_price',
      header: t('detail.total'),
      cell: ({ row }) => `$${row.original.total_price.toLocaleString()}`,
    },
    {
      accessorKey: 'status',
      header: t('detail.status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: t('detail.date'),
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
  ]

  const reviewColumns: ColumnDef<Review>[] = [
    {
      accessorKey: 'product',
      header: t('detail.product'),
      cell: ({ row }) =>
        typeof row.original.product === 'object' ? row.original.product.name : row.original.product,
    },
    {
      accessorKey: 'rating',
      header: t('detail.rating'),
      cell: ({ row }) => `${row.original.rating}/5`,
    },
    {
      accessorKey: 'comment',
      header: t('detail.comment'),
      cell: ({ row }) => <span className="line-clamp-2 max-w-xs">{row.original.comment}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: t('detail.date'),
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
  ]

  const loyaltyColumns: ColumnDef<LoyaltyTransaction>[] = [
    {
      accessorKey: 'type',
      header: t('detail.type'),
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'points',
      header: t('detail.points'),
      cell: ({ row }) => (
        <span
          className={
            row.original.points > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }
        >
          {row.original.points > 0 ? '+' : ''}
          {row.original.points}
        </span>
      ),
    },
    { accessorKey: 'description', header: t('detail.description') },
    {
      accessorKey: 'createdAt',
      header: t('detail.date'),
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
  ]

  if (isLoading) return <LoadingState />
  if (isError || !user) return <ErrorState message={t('notFound')} onRetry={refetch} />

  const initials = (user.name || user.email).slice(0, 2).toUpperCase()
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('detail.title')}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
            <ArrowLeft className="mr-2 size-4" /> {t('detail.backToUsers')}
          </Button>
        }
      />

      <Card>
        <CardContent className="flex items-start gap-6 pt-2">
          <Avatar className="size-16">
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 flex-1">
            <div>
              <p className="text-sm text-muted-foreground">{t('detail.name')}</p>
              <p className="font-medium">{user.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('detail.email')}</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('detail.roles')}</p>
              <div className="flex gap-1">
                {user.roles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('detail.phone')}</p>
              <p className="font-medium">{user.phone || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('detail.address')}</p>
              <p className="font-medium">{user.address || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('detail.dateOfBirth')}</p>
              <p className="font-medium">
                {user.date_of_birth ? format(new Date(user.date_of_birth), 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('detail.created')}</p>
              <p className="font-medium">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders">{t('detail.orders')}</TabsTrigger>
          <TabsTrigger value="reviews">{t('detail.reviews')}</TabsTrigger>
          <TabsTrigger value="loyalty">{t('detail.loyalty')}</TabsTrigger>
          <TabsTrigger value="addresses">{t('detail.addresses')}</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <DataTable
            columns={orderColumns}
            data={ordersData?.orders ?? []}
            searchKey="_id"
            searchPlaceholder={t('detail.searchOrders')}
          />
        </TabsContent>
        <TabsContent value="reviews">
          <DataTable
            columns={reviewColumns}
            data={reviewsData?.reviews ?? []}
            searchKey="comment"
            searchPlaceholder={t('detail.searchReviews')}
          />
        </TabsContent>
        <TabsContent value="loyalty">
          <DataTable
            columns={loyaltyColumns}
            data={loyaltyData?.transactions ?? []}
            searchKey="description"
            searchPlaceholder={t('detail.searchTransactions')}
          />
        </TabsContent>
        <TabsContent value="addresses">
          <AddressesTab
            addresses={addressesData?.addresses ?? []}
            isLoading={addressesLoading}
            t={t}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AddressesTab({
  addresses,
  isLoading,
  t,
}: {
  addresses: Address[]
  isLoading: boolean
  t: (key: string) => string
}) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {t('detail.addressesLoading')}
      </div>
    )
  }

  if (addresses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <MapPin className="size-8 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{t('detail.addressesEmpty')}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
      {addresses.map((addr) => (
        <Card key={addr._id} className={addr.is_default ? 'border-primary' : ''}>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{addr.full_name}</CardTitle>
              {addr.is_default && (
                <Badge variant="default" className="text-xs">
                  {t('detail.addressesDefault')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-muted-foreground space-y-1">
            <p>{addr.phone}</p>
            <p>{addr.street}</p>
            <p>
              {addr.ward}, {addr.district}
            </p>
            <p>{addr.province}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
