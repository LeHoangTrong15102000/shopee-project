import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Eye, Trash2, MoreHorizontal, Star } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { DataTable } from 'src/components/shared/DataTable';
import { PageHeader } from 'src/components/shared/PageHeader';
import { StatCard } from 'src/components/shared/StatCard';
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog';
import { ErrorState } from 'src/components/shared/ErrorState';
import reviewsApi from 'src/apis/reviews.api';
import type { Review } from 'src/types';

export default function ReviewListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-reviews', page],
    queryFn: () => reviewsApi.getReviews({ page: page + 1, limit: 10 }).then((r) => r.data.data),
  });
  const { data: stats } = useQuery({
    queryKey: ['admin-review-stats'],
    queryFn: () => reviewsApi.getReviewStats().then((r) => r.data.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => reviewsApi.deleteReview(id),
    onSuccess: () => {
      toast.success('Review deleted');
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: () => toast.error('Failed to delete review'),
  });

  const columns: ColumnDef<Review>[] = [
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <span className="max-w-[150px] truncate">{row.original.product.name}</span>
      ),
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => row.original.user.name || row.original.user.email,
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <Badge variant="secondary">
          <Star className="mr-1 size-3" />
          {row.original.rating}
        </Badge>
      ),
    },
    {
      accessorKey: 'comment',
      header: 'Comment',
      cell: ({ row }) => <span className="max-w-[200px] truncate">{row.original.comment}</span>,
    },
    { accessorKey: 'helpful_count', header: 'Likes' },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Review actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/reviews/${row.original._id}`)}>
              <Eye className="mr-2 size-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original._id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="Manage product reviews" />
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Reviews" value={stats.total} />
          <StatCard
            label="Average Rating"
            value={stats.average_rating?.toFixed(1) ?? '0'}
            icon={<Star className="size-4" />}
          />
          <StatCard label="5-Star Reviews" value={stats.rating_distribution?.['5'] ?? 0} />
        </div>
      )}
      {isError && <ErrorState message="Failed to load reviews" onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={data?.reviews ?? []}
        isLoading={isLoading}
        searchKey="comment"
        searchPlaceholder="Search reviews..."
        manualPagination
        pageIndex={page}
        pageCount={data?.pagination?.totalPages ?? 1}
        onPaginationChange={(p) => setPage(p)}
        totalRows={data?.pagination?.total}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Review"
        description="This will permanently delete this review."
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        isLoading={deleteMut.isPending}
      />
    </div>
  );
}
