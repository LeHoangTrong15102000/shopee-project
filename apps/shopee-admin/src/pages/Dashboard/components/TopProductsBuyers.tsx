import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table'
import { formatCurrency } from 'src/utils/format'

interface TopProductsBuyersProps {
  topProducts: Array<{ _id: string; name: string; revenue: number; sold: number }> | undefined
  topBuyers:
    | Array<{ _id: string; name: string; email: string; total_orders: number; total_spent: number }>
    | undefined
}

export default function TopProductsBuyers({ topProducts, topBuyers }: TopProductsBuyersProps) {
  const { t } = useTranslation('dashboard')

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('tables.topProductsByRevenue')}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tables.product')}</TableHead>
                <TableHead className="text-right">{t('tables.revenue')}</TableHead>
                <TableHead className="text-right">{t('tables.sold')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(topProducts ?? []).map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                  <TableCell className="text-right">{p.sold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('tables.topBuyers')}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tables.customer')}</TableHead>
                <TableHead className="text-right">{t('tables.orders')}</TableHead>
                <TableHead className="text-right">{t('tables.totalSpent')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(topBuyers ?? []).map((b) => (
                <TableRow key={b._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-muted-foreground">{b.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{b.total_orders}</TableCell>
                  <TableCell className="text-right">{formatCurrency(b.total_spent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
