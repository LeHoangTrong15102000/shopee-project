import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ErrorState } from 'src/components/shared/ErrorState'
import { Skeleton } from 'src/components/ui/skeleton'
import { useOrderDetail, useUpdateOrderStatus } from 'src/hooks/useOrderDetail'
import { useOrderTracking } from 'src/hooks/useTracking'
import { formatPrice } from '@shopee/shared-utils'
import type { OrderStatus } from 'src/types'

const statusFlow: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

function TrackingCard({ orderId }: { orderId: string }) {
  const { t } = useTranslation('orders')
  const { data, isLoading, isError } = useOrderTracking(orderId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tracking.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
        {isError && (
          <p className="text-muted-foreground">{t('tracking.errorState')}</p>
        )}
        {!isLoading && !isError && !data && (
          <p className="text-muted-foreground">{t('tracking.emptyState')}</p>
        )}
        {!isLoading && !isError && data && (
          <>
            {data.carrier && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('tracking.carrier')}</span>
                <span>{data.carrier}</span>
              </div>
            )}
            {data.trackingNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('tracking.trackingNumber')}</span>
                <span className="font-mono text-xs">{data.trackingNumber}</span>
              </div>
            )}
            {data.estimatedDelivery && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('tracking.estimatedDelivery')}</span>
                <span>{data.estimatedDelivery}</span>
              </div>
            )}
            {data.currentStatus && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('tracking.currentStatus')}</span>
                <span className="capitalize">{data.currentStatus}</span>
              </div>
            )}
            {data.events && data.events.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="font-medium">{t('tracking.events')}</p>
                {data.events.map((ev, i) => (
                  <div key={i} className="rounded border p-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      {ev.location && <span>{ev.location}</span>}
                      <span>{ev.timestamp}</span>
                    </div>
                    <p className="mt-0.5">{ev.description}</p>
                  </div>
                ))}
              </div>
            )}
            {(!data.carrier && !data.trackingNumber && !data.currentStatus && data.events.length === 0) && (
              <p className="text-muted-foreground">{t('tracking.emptyState')}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function OrderDetailPage() {
  const { t } = useTranslation('orders')
  const { t: tc } = useTranslation('common')
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: order, isLoading, error } = useOrderDetail(id)

  const updateMut = useUpdateOrderStatus(id)

  if (isLoading) return <LoadingState />
  if (error || !order) return <ErrorState message={t('notFound')} />

  const customer = typeof order.user === 'object' ? order.user : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('detail.orderTitle', { id: order._id.slice(-8) })}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
            <ArrowLeft className="mr-2 size-4" />
            {tc('buttons.back')}
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('detail.items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('detail.product')}</TableHead>
                  <TableHead className="text-right">{t('detail.price')}</TableHead>
                  <TableHead className="text-right">{t('detail.qty')}</TableHead>
                  <TableHead className="text-right">{t('detail.subtotal')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, i) => {
                  const name = typeof item.product === 'object' ? item.product.name : item.product
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                      <TableCell className="text-right">{item.buy_count}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.price * item.buy_count)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end text-lg font-bold">
              {t('detail.total')}: {formatPrice(order.total_price)}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.status')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusBadge status={order.status} />
              <Select
                value={order.status}
                onValueChange={(v) => updateMut.mutate(v as OrderStatus)}
              >
                <SelectTrigger aria-label={t('detail.updateStatus')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFlow.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {t(`status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-1 text-xs text-muted-foreground">
                {statusFlow.map((s) => (
                  <div
                    key={s}
                    className={`flex items-center gap-2 ${statusFlow.indexOf(s) <= statusFlow.indexOf(order.status) ? 'text-foreground' : ''}`}
                  >
                    <div
                      className={`size-2 rounded-full ${statusFlow.indexOf(s) <= statusFlow.indexOf(order.status) ? 'bg-primary' : 'bg-muted'}`}
                    />
                    <span className="capitalize">{t(`status.${s}`)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {customer && (
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.customer')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{customer.name || tc('states.notAvailable')}</p>
                <p className="text-muted-foreground">{customer.email}</p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('detail.date')}</span>
                <span>{format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
              {order.payment_method && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('detail.payment')}</span>
                  <span>{order.payment_method}</span>
                </div>
              )}
              {order.shipping_address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('detail.address')}</span>
                  <span className="text-right break-all">{order.shipping_address}</span>
                </div>
              )}
            </CardContent>
          </Card>
          {id && <TrackingCard orderId={id} />}
        </div>
      </div>
    </div>
  )
}
