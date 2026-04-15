import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, Star, Trash2, CheckCircle, Flag } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Badge } from 'src/components/ui/badge'
import { Separator } from 'src/components/ui/separator'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ErrorState } from 'src/components/shared/ErrorState'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { useReviewDetail, useDeleteComment } from 'src/hooks/useReviewDetail'
import { useReviewModerationStore } from 'src/stores/review-moderation.store'
import { useState } from 'react'

export default function ReviewDetailPage() {
  const { t } = useTranslation('reviews')
  const { t: tc } = useTranslation('common')
  const { id } = useParams()
  const navigate = useNavigate()
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
  const { getStatus, setStatus } = useReviewModerationStore()

  const { data: review, isLoading, isError, refetch } = useReviewDetail(id)

  const deleteCommentMut = useDeleteComment(id, () => setDeleteCommentId(null))

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={t('error')} onRetry={refetch} />
  if (!review) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('detail.title')}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/reviews')}>
            <ArrowLeft className="mr-2 size-4" />
            {tc('buttons.back')}
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('detail.review')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Star className="mr-1 size-3" />
                {review.rating}/5
              </Badge>
              <StatusBadge status={getStatus(review._id)} />
              <span className="text-sm text-muted-foreground">
                {format(new Date(review.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus(review._id, 'approved')
                  toast.success(t('toast.approved'))
                }}
              >
                <CheckCircle className="mr-1 size-4" />
                {t('actions.approve')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus(review._id, 'flagged')
                  toast.success(t('toast.flagged'))
                }}
              >
                <Flag className="mr-1 size-4" />
                {t('actions.flag')}
              </Button>
            </div>
            <p>{review.comment}</p>
            {review.images?.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
              <h2 className="mb-3 font-medium">
                {t('detail.commentsCount', { count: review.comments?.length ?? 0 })}
              </h2>
              {(review.comments ?? []).map((c) => (
                <div key={c._id} className="mb-3 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.user.name || c.user.email}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.createdAt), 'MMM d, yyyy')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={t('common:aria.deleteItem', { item: t('reviews:comment') })}
                        onClick={() => setDeleteCommentId(c._id)}
                      >
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
              <CardTitle>{t('detail.product')}</CardTitle>
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
              <CardTitle>{t('detail.user')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{review.user.name || tc('states.notAvailable')}</p>
              <p className="text-muted-foreground">{review.user.email}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={!!deleteCommentId}
        onOpenChange={(o) => !o && setDeleteCommentId(null)}
        title={t('toast.deleteCommentTitle')}
        description={t('toast.deleteCommentDescription')}
        onConfirm={() => deleteCommentId && deleteCommentMut.mutate(deleteCommentId)}
        isLoading={deleteCommentMut.isPending}
      />
    </div>
  )
}
