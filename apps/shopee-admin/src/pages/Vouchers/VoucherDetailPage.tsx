import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
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
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ErrorState } from 'src/components/shared/ErrorState'
import { useVoucherDetail, useVoucherUsage } from 'src/hooks/useVoucherDetail'
import { formatCurrency } from 'src/utils/format'

export default function VoucherDetailPage() {
  const { t } = useTranslation('vouchers')
  const { t: tc } = useTranslation('common')
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: voucher, isLoading, isError, refetch } = useVoucherDetail(id)

  const { data: usageData } = useVoucherUsage(id)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={t('error')} onRetry={refetch} />
  if (!voucher) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('detail.voucherTitle', { code: voucher.code })}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/vouchers')}>
            <ArrowLeft className="mr-2 size-4" />
            {tc('buttons.back')}
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('detail.usageHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('detail.user')}</TableHead>
                  <TableHead>{t('detail.order')}</TableHead>
                  <TableHead className="text-right">{t('detail.discount')}</TableHead>
                  <TableHead>{t('detail.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usageData?.usage ?? []).map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>{typeof u.user === 'object' ? u.user.email : u.user}</TableCell>
                    <TableCell className="font-mono text-xs">{u.order.slice(-8)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(u.discount_amount)}
                    </TableCell>
                    <TableCell>{format(new Date(u.createdAt), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
                {(!usageData?.usage || usageData.usage.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t('detail.noUsage')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.status')}</span>
              <StatusBadge status={voucher.is_active ? 'active' : 'inactive'} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.type')}</span>
              <span className="capitalize">{voucher.discount_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.value')}</span>
              <span>
                {voucher.discount_type === 'percentage'
                  ? `${voucher.discount_value}%`
                  : formatCurrency(voucher.discount_value)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.minOrder')}</span>
              <span>{formatCurrency(voucher.min_order_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.usage')}</span>
              <span>
                {voucher.used_count}/{voucher.usage_limit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.start')}</span>
              <span>{format(new Date(voucher.start_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.end')}</span>
              <span>{format(new Date(voucher.end_date), 'MMM d, yyyy')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
