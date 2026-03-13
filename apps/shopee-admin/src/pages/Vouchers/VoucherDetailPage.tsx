import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table';
import { PageHeader } from 'src/components/shared/PageHeader';
import { StatusBadge } from 'src/components/shared/StatusBadge';
import { LoadingState } from 'src/components/shared/LoadingState';
import { ErrorState } from 'src/components/shared/ErrorState';
import vouchersApi from 'src/apis/vouchers.api';
import { formatCurrency } from 'src/utils/format';

export default function VoucherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: voucher,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-voucher', id],
    queryFn: () => vouchersApi.getVoucher(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: usageData } = useQuery({
    queryKey: ['admin-voucher-usage', id],
    queryFn: () => vouchersApi.getVoucherUsage(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load voucher" onRetry={refetch} />;
  if (!voucher) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Voucher: ${voucher.code}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/vouchers')}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Usage History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead>Date</TableHead>
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
                      No usage yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={voucher.is_active ? 'active' : 'inactive'} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize">{voucher.discount_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Value</span>
              <span>
                {voucher.discount_type === 'percentage'
                  ? `${voucher.discount_value}%`
                  : formatCurrency(voucher.discount_value)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Order</span>
              <span>{formatCurrency(voucher.min_order_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usage</span>
              <span>
                {voucher.used_count}/{voucher.usage_limit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start</span>
              <span>{format(new Date(voucher.start_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End</span>
              <span>{format(new Date(voucher.end_date), 'MMM d, yyyy')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
