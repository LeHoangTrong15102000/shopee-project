import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import qaApi from 'src/apis/qa.api'
import { useAdminMutationContext } from './useAdminMutationContext'

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
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteQuestion(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.questionDeleted', { ns: 'qa' }))
      qc.invalidateQueries({ queryKey: QA_KEYS.all })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.deleteQuestionFailed', { ns: 'qa' }))
    },
  })
}

export function useAnswerQuestion(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: string }) =>
      qaApi.answerQuestion(questionId, answer),
    onSuccess: () => {
      toast.success(i18n.t('toast.answerSubmitted', { ns: 'qa' }))
      qc.invalidateQueries({ queryKey: QA_KEYS.all })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.answerFailed', { ns: 'qa' }))
    },
  })
}

export function useDeleteAnswer(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: ({ qId, aId }: { qId: string; aId: string }) => qaApi.deleteAnswer(qId, aId),
    onSuccess: () => {
      toast.success(i18n.t('toast.answerDeleted', { ns: 'qa' }))
      qc.invalidateQueries({ queryKey: QA_KEYS.all })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.deleteAnswerFailed', { ns: 'qa' }))
    },
  })
}
