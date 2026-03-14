import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Avatar, AvatarFallback } from 'src/components/ui/avatar';
import { Badge } from 'src/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs';
import { DataTable } from 'src/components/shared/DataTable';
import { PageHeader } from 'src/components/shared/PageHeader';
import { LoadingState } from 'src/components/shared/LoadingState';
import { ErrorState } from 'src/components/shared/ErrorState';
import { StatusBadge } from 'src/components/shared/StatusBadge';
import usersApi from 'src/apis/users.api';
import ordersApi from 'src/apis/orders.api';
import reviewsApi from 'src/apis/reviews.api';
import loyaltyApi from 'src/apis/loyalty.api';
import type { Order, Review, LoyaltyTransaction } from 'src/types';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('orders');

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => usersApi.getUser(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-user-orders', id],
    queryFn: () => ordersApi.getOrders({ user_id: id, limit: 50 }).then((r) => r.data.data),
    enabled: !!id && activeTab === 'orders',
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['admin-user-reviews', id],
    queryFn: () => reviewsApi.getReviews({ user_id: id, limit: 50 }).then((r) => r.data.data),
    enabled: !!id && activeTab === 'reviews',
  });

  const { data: loyaltyData } = useQuery({
    queryKey: ['admin-user-loyalty', id],
    queryFn: () => loyaltyApi.getTransactions({ user_id: id, limit: 50 }).then((r) => r.data.data),
    enabled: !!id && activeTab === 'loyalty',
  });
  const orderColumns: ColumnDef<Order>[] = [
    { accessorKey: '_id', header: 'Order ID', cell: ({ row }) => row.original._id.slice(-8) },
    {
      accessorKey: 'total_price',
      header: 'Total',
      cell: ({ row }) => `$${row.original.total_price.toLocaleString()}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
  ];

  const reviewColumns: ColumnDef<Review>[] = [
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) =>
        typeof row.original.product === 'object' ? row.original.product.name : row.original.product,
    },
    { accessorKey: 'rating', header: 'Rating', cell: ({ row }) => `${row.original.rating}/5` },
    {
      accessorKey: 'comment',
      header: 'Comment',
      cell: ({ row }) => <span className="line-clamp-2 max-w-xs">{row.original.comment}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
  ];

  const loyaltyColumns: ColumnDef<LoyaltyTransaction>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'points',
      header: 'Points',
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
    { accessorKey: 'description', header: 'Description' },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
  ];

  if (isLoading) return <LoadingState />;
  if (isError || !user) return <ErrorState message="User not found" onRetry={refetch} />;

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
  return (
    <div className="space-y-6">
      <PageHeader
        title="User Detail"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
            <ArrowLeft className="mr-2 size-4" /> Back to Users
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
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roles</p>
              <div className="flex gap-1">
                {user.roles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{user.phone || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{user.address || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">
                {user.date_of_birth ? format(new Date(user.date_of_birth), 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <DataTable
            columns={orderColumns}
            data={ordersData?.orders ?? []}
            searchKey="_id"
            searchPlaceholder="Search orders..."
          />
        </TabsContent>
        <TabsContent value="reviews">
          <DataTable
            columns={reviewColumns}
            data={reviewsData?.reviews ?? []}
            searchKey="comment"
            searchPlaceholder="Search reviews..."
          />
        </TabsContent>
        <TabsContent value="loyalty">
          <DataTable
            columns={loyaltyColumns}
            data={loyaltyData?.transactions ?? []}
            searchKey="description"
            searchPlaceholder="Search transactions..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
