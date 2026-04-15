import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Trash2, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/ui/collapsible'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatCard } from 'src/components/shared/StatCard'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ErrorState } from 'src/components/shared/ErrorState'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { useQuestions, useQAStats, useDeleteQuestion, useDeleteAnswer } from 'src/hooks/useQA'

export default function QAPage() {
  const [deleteQ, setDeleteQ] = useState<string | null>(null)
  const [deleteA, setDeleteA] = useState<{ qId: string; aId: string } | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const { t } = useTranslation('qa')

  const { data, isLoading, isError, refetch } = useQuestions()
  const { data: stats } = useQAStats()
  const deleteQMut = useDeleteQuestion(() => setDeleteQ(null))
  const deleteAMut = useDeleteAnswer(() => setDeleteA(null))

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={t('error')} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label={t('stats.totalQuestions')}
            value={stats.total_questions}
            icon={<MessageSquare className="size-4" />}
          />
          <StatCard label={t('stats.totalAnswers')} value={stats.total_answers} />
          <StatCard label={t('stats.unanswered')} value={stats.unanswered_questions} />
        </div>
      )}
      <div className="space-y-3">
        {(data?.questions ?? []).map((q) => (
          <Card key={q._id}>
            <Collapsible open={expanded.has(q._id)} onOpenChange={() => toggle(q._id)}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CollapsibleTrigger className="flex items-center gap-2 text-left">
                  {expanded.has(q._id) ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                  <div>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {q.user.name || q.user.email} ·{' '}
                      {format(new Date(q.createdAt), 'MMM d, yyyy')} · {q.answers_count}{' '}
                      {t('answers')}
                    </p>
                  </div>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t('common:aria.deleteItem', { item: t('qa:question') })}
                  onClick={() => setDeleteQ(q._id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <p className="mb-3 text-sm">{q.content || q.question}</p>
                  {(q.answers ?? []).length > 0 ? (
                    <div className="space-y-2 border-t pt-3">
                      {q.answers.map((a) => (
                        <div
                          key={a._id}
                          className="flex items-start justify-between rounded-md bg-muted/50 p-3"
                        >
                          <div className="flex-1">
                            <p className="text-sm">{a.content || a.answer}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              by{' '}
                              {a.user?.name ||
                                a.user?.email ||
                                a.user_name ||
                                t('common:states.unknown')}{' '}
                              ·{' '}
                              {format(
                                new Date(a.createdAt || a.created_at || Date.now()),
                                'MMM d, yyyy',
                              )}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('common:aria.deleteItem', { item: t('qa:answer') })}
                            onClick={() => setDeleteA({ qId: q._id, aId: a._id })}
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t('noAnswers')}</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
      <ConfirmDialog
        open={!!deleteQ}
        onOpenChange={(o) => !o && setDeleteQ(null)}
        title={t('toast.deleteQuestionTitle')}
        description={t('toast.deleteQuestionDescription')}
        onConfirm={() => deleteQ && deleteQMut.mutate(deleteQ)}
        isLoading={deleteQMut.isPending}
      />
      <ConfirmDialog
        open={!!deleteA}
        onOpenChange={(o) => !o && setDeleteA(null)}
        title={t('toast.deleteAnswerTitle')}
        description={t('toast.deleteAnswerDescription')}
        onConfirm={() => deleteA && deleteAMut.mutate(deleteA)}
        isLoading={deleteAMut.isPending}
      />
    </div>
  )
}
