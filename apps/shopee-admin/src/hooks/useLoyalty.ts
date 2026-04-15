import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import loyaltyApi from 'src/apis/loyalty.api'
import { useActivityLogStore } from 'src/stores/activity-log.store'
import { useAuthStore } from 'src/stores/auth.store'

export const LOYALTY_KEYS = {
  rewards: ['admin-rewards'] as const,
  transactions: ['admin-loyalty-tx'] as const,
  stats: ['admin-loyalty-stats'] as const,
}

export function useRewards() {
  return useQuery({
    queryKey: LOYALTY_KEYS.rewards,
    queryFn: () => loyaltyApi.getRewards().then((r) => r.data.data),
  })
}

export function useLoyaltyTransactions() {
  return useQuery({
    queryKey: LOYALTY_KEYS.transactions,
    queryFn: () => loyaltyApi.getTransactions().then((r) => r.data.data),
  })
}

export function useLoyaltyStats() {
  return useQuery({
    queryKey: LOYALTY_KEYS.stats,
    queryFn: () => loyaltyApi.getStats().then((r) => r.data.data),
  })
}

export function useCreateReward(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (body: { name: string; description: string; points_required: number }) =>
      loyaltyApi.createReward(body),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.rewardCreated', { ns: 'loyalty' }))
      addLog({ action: 'create', entityType: 'reward', entityName: vars.name, adminEmail: email })
      qc.invalidateQueries({ queryKey: LOYALTY_KEYS.rewards })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.createFailed', { ns: 'loyalty' })),
  })
}

export function useUpdateReward(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: { name: string; description: string; points_required: number }
    }) => loyaltyApi.updateReward(id, body),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.rewardUpdated', { ns: 'loyalty' }))
      addLog({
        action: 'update',
        entityType: 'reward',
        entityName: vars.body.name,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: LOYALTY_KEYS.rewards })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.updateFailed', { ns: 'loyalty' })),
  })
}

export function useDeleteReward(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (id: string) => loyaltyApi.deleteReward(id),
    onSuccess: (_, id) => {
      toast.success(i18n.t('toast.rewardDeleted', { ns: 'loyalty' }))
      addLog({ action: 'delete', entityType: 'reward', entityName: id, adminEmail: email })
      qc.invalidateQueries({ queryKey: LOYALTY_KEYS.rewards })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.deleteFailed', { ns: 'loyalty' })),
  })
}

export function useAdjustPoints(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (body: { user_id: string; points: number; description: string }) =>
      loyaltyApi.adjustPoints(body),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.pointsAdjusted', { ns: 'loyalty' }))
      addLog({
        action: 'update',
        entityType: 'loyalty',
        entityName: `${vars.points > 0 ? '+' : ''}${vars.points} pts for ${vars.user_id}`,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: LOYALTY_KEYS.transactions })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.adjustPointsFailed', { ns: 'loyalty' })),
  })
}
