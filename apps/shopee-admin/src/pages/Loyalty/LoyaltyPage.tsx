import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Gift } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { DataTable } from 'src/components/shared/DataTable';
import { PageHeader } from 'src/components/shared/PageHeader';
import { StatCard } from 'src/components/shared/StatCard';
import { StatusBadge } from 'src/components/shared/StatusBadge';
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog';
import { ErrorState } from 'src/components/shared/ErrorState';
import loyaltyApi from 'src/apis/loyalty.api';
import type { LoyaltyReward, LoyaltyTransaction } from 'src/types';

export default function LoyaltyPage() {
  const qc = useQueryClient();
  const [rewardDialog, setRewardDialog] = useState(false);
  const [editReward, setEditReward] = useState<LoyaltyReward | null>(null);
  const [deleteReward, setDeleteReward] = useState<LoyaltyReward | null>(null);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [rewardForm, setRewardForm] = useState({ name: '', description: '', points_required: 0 });
  const [adjustForm, setAdjustForm] = useState({ user_id: '', points: 0, description: '' });

  const {
    data: rewards,
    isLoading: loadingRewards,
    isError: rewardsError,
    refetch: refetchRewards,
  } = useQuery({
    queryKey: ['admin-rewards'],
    queryFn: () => loyaltyApi.getRewards().then((r) => r.data.data),
  });
  const {
    data: transactions,
    isLoading: loadingTx,
    isError: txError,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['admin-loyalty-tx'],
    queryFn: () => loyaltyApi.getTransactions().then((r) => r.data.data),
  });
  const { data: stats } = useQuery({
    queryKey: ['admin-loyalty-stats'],
    queryFn: () => loyaltyApi.getStats().then((r) => r.data.data),
  });

  const createRewardMut = useMutation({
    mutationFn: () => loyaltyApi.createReward(rewardForm),
    onSuccess: () => {
      toast.success('Reward created');
      setRewardDialog(false);
      qc.invalidateQueries({ queryKey: ['admin-rewards'] });
    },
    onError: () => toast.error('Failed to create reward'),
  });
  const updateRewardMut = useMutation({
    mutationFn: () => loyaltyApi.updateReward(editReward!._id, rewardForm),
    onSuccess: () => {
      toast.success('Reward updated');
      setEditReward(null);
      qc.invalidateQueries({ queryKey: ['admin-rewards'] });
    },
    onError: () => toast.error('Failed to update reward'),
  });
  const deleteRewardMut = useMutation({
    mutationFn: (id: string) => loyaltyApi.deleteReward(id),
    onSuccess: () => {
      toast.success('Reward deleted');
      setDeleteReward(null);
      qc.invalidateQueries({ queryKey: ['admin-rewards'] });
    },
    onError: () => toast.error('Failed to delete reward'),
  });
  const adjustMut = useMutation({
    mutationFn: () => loyaltyApi.adjustPoints(adjustForm),
    onSuccess: () => {
      toast.success('Points adjusted');
      setAdjustDialog(false);
      qc.invalidateQueries({ queryKey: ['admin-loyalty-tx'] });
    },
    onError: () => toast.error('Failed to adjust points'),
  });

  const rewardCols: ColumnDef<LoyaltyReward>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="max-w-[200px] truncate">{row.original.description}</span>,
    },
    { accessorKey: 'points_required', header: 'Points' },
    {
      accessorKey: 'is_active',
      header: 'Status',
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
            aria-label="Edit reward"
            onClick={() => {
              setEditReward(row.original);
              setRewardForm({
                name: row.original.name,
                description: row.original.description,
                points_required: row.original.points_required,
              });
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete reward"
            onClick={() => setDeleteReward(row.original)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const txCols: ColumnDef<LoyaltyTransaction>[] = [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const u = row.original.user;
        return typeof u === 'object' ? u.email : u;
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <StatusBadge status={row.original.type} />,
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

  return (
    <div className="space-y-6">
      <PageHeader title="Loyalty Program" description="Manage rewards and points" />
      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="rewards" className="space-y-4">
          {rewardsError && <ErrorState message="Failed to load rewards" onRetry={refetchRewards} />}
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setRewardDialog(true);
                setRewardForm({ name: '', description: '', points_required: 0 });
              }}
            >
              <Plus className="mr-2 size-4" />
              Add Reward
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
          {txError && <ErrorState message="Failed to load transactions" onRetry={refetchTx} />}
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
              <StatCard label="Total Users" value={stats.total_users} />
              <StatCard
                label="Points Earned"
                value={stats.total_points_earned}
                icon={<Gift className="size-4" />}
              />
              <StatCard label="Points Redeemed" value={stats.total_points_redeemed} />
            </div>
          )}
          <Button size="sm" onClick={() => setAdjustDialog(true)}>
            Adjust Points
          </Button>
        </TabsContent>
      </Tabs>

      <Dialog open={rewardDialog} onOpenChange={setRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Reward</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="create-reward-name">Name</Label>
              <Input
                id="create-reward-name"
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-reward-desc">Description</Label>
              <Textarea
                id="create-reward-desc"
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-reward-points">Points Required</Label>
              <Input
                id="create-reward-points"
                type="number"
                value={rewardForm.points_required}
                onChange={(e) => setRewardForm({ ...rewardForm, points_required: +e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createRewardMut.mutate()} disabled={createRewardMut.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editReward} onOpenChange={(o) => !o && setEditReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reward</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-reward-name">Name</Label>
              <Input
                id="edit-reward-name"
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-reward-desc">Description</Label>
              <Textarea
                id="edit-reward-desc"
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-reward-points">Points Required</Label>
              <Input
                id="edit-reward-points"
                type="number"
                value={rewardForm.points_required}
                onChange={(e) => setRewardForm({ ...rewardForm, points_required: +e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => updateRewardMut.mutate()} disabled={updateRewardMut.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="adjust-user-id">User ID</Label>
              <Input
                id="adjust-user-id"
                value={adjustForm.user_id}
                onChange={(e) => setAdjustForm({ ...adjustForm, user_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="adjust-points">Points (+/-)</Label>
              <Input
                id="adjust-points"
                type="number"
                value={adjustForm.points}
                onChange={(e) => setAdjustForm({ ...adjustForm, points: +e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="adjust-desc">Description</Label>
              <Input
                id="adjust-desc"
                value={adjustForm.description}
                onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => adjustMut.mutate()} disabled={adjustMut.isPending}>
              Adjust
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteReward}
        onOpenChange={(o) => !o && setDeleteReward(null)}
        title="Delete Reward"
        description={`Delete "${deleteReward?.name}"?`}
        onConfirm={() => deleteReward && deleteRewardMut.mutate(deleteReward._id)}
        isLoading={deleteRewardMut.isPending}
      />
    </div>
  );
}
