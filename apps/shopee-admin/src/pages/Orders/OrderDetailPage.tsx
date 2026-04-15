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
import { useOrderDetail, useUpdateOrderStatus } from 'src/hooks/useOrderDetail'
import { formatCurrency } from 'src/utils/format'
import type { OrderStatus } from 'src/types'

const statusFlow: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

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
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">{item.buy_count}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price * item.buy_count)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end text-lg font-bold">
              {t('detail.total')}: {formatCurrency(order.total_price)}
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
        </div>
      </div>
    </div>
  )
}
