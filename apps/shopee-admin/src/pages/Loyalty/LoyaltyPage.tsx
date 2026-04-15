import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, Gift } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Textarea } from 'src/components/ui/textarea'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatCard } from 'src/components/shared/StatCard'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { ErrorState } from 'src/components/shared/ErrorState'
import {
  useRewards,
  useLoyaltyTransactions,
  useLoyaltyStats,
  useCreateReward,
  useUpdateReward,
  useDeleteReward,
  useAdjustPoints,
} from 'src/hooks/useLoyalty'
import type { LoyaltyReward, LoyaltyTransaction } from 'src/types'

export default function LoyaltyPage() {
  const { t } = useTranslation('loyalty')
  const { t: tc } = useTranslation('common')
  const [rewardDialog, setRewardDialog] = useState(false)
  const [editReward, setEditReward] = useState<LoyaltyReward | null>(null)
  const [deleteReward, setDeleteReward] = useState<LoyaltyReward | null>(null)
  const [adjustDialog, setAdjustDialog] = useState(false)
  const [rewardForm, setRewardForm] = useState({ name: '', description: '', points_required: 0 })
  const [adjustForm, setAdjustForm] = useState({ user_id: '', points: 0, description: '' })

  const {
    data: rewards,
    isLoading: loadingRewards,
    isError: rewardsError,
    refetch: refetchRewards,
  } = useRewards()
  const {
    data: transactions,
    isLoading: loadingTx,
    isError: txError,
    refetch: refetchTx,
  } = useLoyaltyTransactions()
  const { data: stats } = useLoyaltyStats()

  const createRewardMut = useCreateReward(() => setRewardDialog(false))
  const updateRewardMut = useUpdateReward(() => setEditReward(null))
  const deleteRewardMut = useDeleteReward(() => setDeleteReward(null))
  const adjustMut = useAdjustPoints(() => setAdjustDialog(false))

  const rewardCols: ColumnDef<LoyaltyReward>[] = [
    { accessorKey: 'name', header: t('rewards.name') },
    {
      accessorKey: 'description',
      header: t('rewards.description'),
      cell: ({ row }) => <span className="max-w-[200px] truncate">{row.original.description}</span>,
    },
    { accessorKey: 'points_required', header: t('rewards.points') },
    {
      accessorKey: 'is_active',
      header: t('rewards.status'),
      cell: ({ row }) => <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('common:aria.editItem', { item: t('loyalty:reward') })}
            onClick={() => {
              setEditReward(row.original)
              setRewardForm({
                name: row.original.name,
                description: row.original.description,
                points_required: row.original.points_required,
              })
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('common:aria.deleteItem', { item: t('loyalty:reward') })}
            onClick={() => setDeleteReward(row.original)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const txCols: ColumnDef<LoyaltyTransaction>[] = [
    {
      accessorKey: 'user',
      header: t('transactions.user'),
      cell: ({ row }) => {
        const u = row.original.user
        return typeof u === 'object' ? u.email : u
      },
    },
    {
      accessorKey: 'type',
      header: t('transactions.type'),
      cell: ({ row }) => <StatusBadge status={row.original.type} />,
    },
    {
      accessorKey: 'points',
      header: t('transactions.points'),
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
    { accessorKey: 'description', header: t('transactions.description') },
    {
      accessorKey: 'createdAt',
      header: t('transactions.date'),
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <Tabs defaultValue="rewards">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap scroll-p-1">
          <TabsTrigger value="rewards">{t('tabs.rewards')}</TabsTrigger>
          <TabsTrigger value="transactions">{t('tabs.transactions')}</TabsTrigger>
          <TabsTrigger value="stats">{t('tabs.stats')}</TabsTrigger>
        </TabsList>
        <TabsContent value="rewards" className="space-y-4">
          {rewardsError && <ErrorState message={t('error')} onRetry={refetchRewards} />}
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setRewardDialog(true)
                setRewardForm({ name: '', description: '', points_required: 0 })
              }}
            >
              <Plus className="mr-2 size-4" />
              {t('rewards.addReward')}
            </Button>
          </div>
          <DataTable
            columns={rewardCols}
            data={rewards?.rewards ?? []}
            isLoading={loadingRewards}
            searchKey="name"
          />
        </TabsContent>
        <TabsContent value="transactions">
          {txError && <ErrorState message={t('transactionsError')} onRetry={refetchTx} />}
          <DataTable
            columns={txCols}
            data={transactions?.transactions ?? []}
            isLoading={loadingTx}
            searchKey="description"
          />
        </TabsContent>
        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label={t('stats.totalUsers')} value={stats.total_users} />
              <StatCard
                label={t('stats.pointsEarned')}
                value={stats.total_points_earned}
                icon={<Gift className="size-4" />}
              />
              <StatCard label={t('stats.pointsRedeemed')} value={stats.total_points_redeemed} />
            </div>
          )}
          <Button size="sm" onClick={() => setAdjustDialog(true)}>
            {t('actions.adjustPoints')}
          </Button>
        </TabsContent>
      </Tabs>

      <Dialog open={rewardDialog} onOpenChange={setRewardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('rewards.createReward')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-reward-name">{t('rewards.name')}</Label>
              <Input
                id="create-reward-name"
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-reward-desc">{t('rewards.description')}</Label>
              <Textarea
                id="create-reward-desc"
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-reward-points">{t('rewards.pointsRequired')}</Label>
              <Input
                id="create-reward-points"
                type="number"
                value={rewardForm.points_required}
                onChange={(e) => setRewardForm({ ...rewardForm, points_required: +e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createRewardMut.mutate(rewardForm)}
              disabled={createRewardMut.isPending}
            >
              {tc('buttons.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editReward} onOpenChange={(o) => !o && setEditReward(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('rewards.editReward')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-reward-name">{t('rewards.name')}</Label>
              <Input
                id="edit-reward-name"
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-reward-desc">{t('rewards.description')}</Label>
              <Textarea
                id="edit-reward-desc"
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-reward-points">{t('rewards.pointsRequired')}</Label>
              <Input
                id="edit-reward-points"
                type="number"
                value={rewardForm.points_required}
                onChange={(e) => setRewardForm({ ...rewardForm, points_required: +e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                editReward && updateRewardMut.mutate({ id: editReward._id, body: rewardForm })
              }
              disabled={updateRewardMut.isPending}
            >
              {tc('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.adjustPoints')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="adjust-user-id">{t('actions.userId')}</Label>
              <Input
                id="adjust-user-id"
                value={adjustForm.user_id}
                onChange={(e) => setAdjustForm({ ...adjustForm, user_id: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adjust-points">{t('actions.pointsAmount')}</Label>
              <Input
                id="adjust-points"
                type="number"
                value={adjustForm.points}
                onChange={(e) => setAdjustForm({ ...adjustForm, points: +e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adjust-desc">{t('rewards.description')}</Label>
              <Input
                id="adjust-desc"
                value={adjustForm.description}
                onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => adjustMut.mutate(adjustForm)} disabled={adjustMut.isPending}>
              {tc('buttons.adjust')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteReward}
        onOpenChange={(o) => !o && setDeleteReward(null)}
        title={t('toast.deleteTitle')}
        description={t('toast.deleteDescription', { name: deleteReward?.name })}
        onConfirm={() => deleteReward && deleteRewardMut.mutate(deleteReward._id)}
        isLoading={deleteRewardMut.isPending}
      />
    </div>
  )
}
