import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import { PageHeader } from 'src/components/shared/PageHeader';
import { LoadingState } from 'src/components/shared/LoadingState';
import { ErrorState } from 'src/components/shared/ErrorState';
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog';
import reviewsApi from 'src/apis/reviews.api';
import { useState } from 'react';

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const {
    data: review,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-review', id],
    queryFn: () => reviewsApi.getReview(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const deleteCommentMut = useMutation({
    mutationFn: (commentId: string) => reviewsApi.deleteComment(commentId),
    onSuccess: () => {
      toast.success('Comment deleted');
      setDeleteCommentId(null);
      qc.invalidateQueries({ queryKey: ['admin-review', id] });
    },
    onError: () => toast.error('Failed to delete comment'),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load review" onRetry={refetch} />;
  if (!review) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Detail"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/reviews')}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Star className="mr-1 size-3" />
                {review.rating}/5
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(review.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
            <p>{review.comment}</p>
            {review.images?.length > 0 && (
              <div className="flex gap-2">
                {review.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Review image ${i + 1}`}
                    className="size-20 rounded object-cover"
                  />
                ))}
              </div>
            )}
            <Separator />
            <div>
              <h4 className="mb-3 font-medium">Comments ({review.comments?.length ?? 0})</h4>
              {(review.comments ?? []).map((c) => (
                <div key={c._id} className="mb-3 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.user.name || c.user.email}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.createdAt), 'MMM d, yyyy')}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteCommentId(c._id)}>
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm">{c.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {review.product.image && (
                <img
                  src={review.product.image}
                  alt={review.product.name}
                  className="h-24 w-full rounded object-cover"
                />
              )}
              <p className="font-medium">{review.product.name}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{review.user.name || 'N/A'}</p>
              <p className="text-muted-foreground">{review.user.email}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={!!deleteCommentId}
        onOpenChange={(o) => !o && setDeleteCommentId(null)}
        title="Delete Comment"
        description="This will permanently delete this comment."
        onConfirm={() => deleteCommentId && deleteCommentMut.mutate(deleteCommentId)}
        isLoading={deleteCommentMut.isPending}
      />
    </div>
  );
}
