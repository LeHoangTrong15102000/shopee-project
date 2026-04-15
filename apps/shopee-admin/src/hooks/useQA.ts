import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import qaApi from 'src/apis/qa.api'
import { useActivityLogStore } from 'src/stores/activity-log.store'
import { useAuthStore } from 'src/stores/auth.store'

export const QA_KEYS = {
  all: ['admin-qa'] as const,
  stats: ['admin-qa-stats'] as const,
}

export function useQuestions() {
  return useQuery({
    queryKey: QA_KEYS.all,
    queryFn: () => qaApi.getQuestions({ limit: 50 }).then((r) => r.data.data),
  })
}

export function useQAStats() {
  return useQuery({
    queryKey: QA_KEYS.stats,
    queryFn: () => qaApi.getQAStats().then((r) => r.data.data),
  })
}

export function useDeleteQuestion(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteQuestion(id),
    onSuccess: (_, id) => {
      toast.success(i18n.t('toast.questionDeleted', { ns: 'qa' }))
      addLog({ action: 'delete', entityType: 'question', entityName: id, adminEmail: email })
      qc.invalidateQueries({ queryKey: QA_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.deleteQuestionFailed', { ns: 'qa' })),
  })
}

export function useDeleteAnswer(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: ({ qId, aId }: { qId: string; aId: string }) => qaApi.deleteAnswer(qId, aId),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.answerDeleted', { ns: 'qa' }))
      addLog({ action: 'delete', entityType: 'answer', entityName: vars.aId, adminEmail: email })
      qc.invalidateQueries({ queryKey: QA_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.deleteAnswerFailed', { ns: 'qa' })),
  })
}
