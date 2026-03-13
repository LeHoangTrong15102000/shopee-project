import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Trash2, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/ui/collapsible'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatCard } from 'src/components/shared/StatCard'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import qaApi from 'src/apis/qa.api'

export default function QAPage() {
  const qc = useQueryClient()
  const [deleteQ, setDeleteQ] = useState<string | null>(null)
  const [deleteA, setDeleteA] = useState<{ qId: string; aId: string } | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['admin-qa'],
    queryFn: () => qaApi.getQuestions({ limit: 50 }).then((r) => r.data.data),
  })
  const { data: stats } = useQuery({ queryKey: ['admin-qa-stats'], queryFn: () => qaApi.getQAStats().then((r) => r.data.data) })

  const deleteQMut = useMutation({
    mutationFn: (id: string) => qaApi.deleteQuestion(id),
    onSuccess: () => { toast.success('Question deleted'); setDeleteQ(null); qc.invalidateQueries({ queryKey: ['admin-qa'] }) },
  })
  const deleteAMut = useMutation({
    mutationFn: ({ qId, aId }: { qId: string; aId: string }) => qaApi.deleteAnswer(qId, aId),
    onSuccess: () => { toast.success('Answer deleted'); setDeleteA(null); qc.invalidateQueries({ queryKey: ['admin-qa'] }) },
  })

  const toggle = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader title="Q&A" description="Manage questions and answers" />
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Questions" value={stats.total_questions} icon={<MessageSquare className="size-4" />} />
          <StatCard label="Total Answers" value={stats.total_answers} />
          <StatCard label="Unanswered" value={stats.unanswered_questions} />
        </div>
      )}
      <div className="space-y-3">
        {(data?.questions ?? []).map((q) => (
          <Card key={q._id}>
            <Collapsible open={expanded.has(q._id)} onOpenChange={() => toggle(q._id)}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CollapsibleTrigger className="flex items-center gap-2 text-left">
                  {expanded.has(q._id) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  <div>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-xs text-muted-foreground">by {q.user.name || q.user.email} · {format(new Date(q.createdAt), 'MMM d, yyyy')} · {q.answers_count} answers</p>
                  </div>
                </CollapsibleTrigger>
                <Button variant="ghost" size="sm" onClick={() => setDeleteQ(q._id)}><Trash2 className="size-4 text-destructive" /></Button>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <p className="mb-3 text-sm">{q.content}</p>
                  <p className="text-xs font-medium text-muted-foreground">Answers will appear here when expanded from the API.</p>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
      <ConfirmDialog open={!!deleteQ} onOpenChange={(o) => !o && setDeleteQ(null)} title="Delete Question" description="This will delete the question and all its answers." onConfirm={() => deleteQ && deleteQMut.mutate(deleteQ)} isLoading={deleteQMut.isPending} />
      <ConfirmDialog open={!!deleteA} onOpenChange={(o) => !o && setDeleteA(null)} title="Delete Answer" description="This will permanently delete this answer." onConfirm={() => deleteA && deleteAMut.mutate(deleteA)} isLoading={deleteAMut.isPending} />
    </div>
  )
}

