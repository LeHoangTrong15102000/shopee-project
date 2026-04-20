import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { ErrorState } from 'src/components/shared/ErrorState'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from 'src/hooks/useCategories'
import type { Category } from 'src/types'

export default function CategoryListPage() {
  const { t } = useTranslation('categories')
  const { t: tc } = useTranslation('common')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [deleteCat, setDeleteCat] = useState<Category | null>(null)
  const [name, setName] = useState('')

  const { data: categories, isLoading, isError, refetch } = useCategories()

  const createMut = useCreateCategory(() => {
    setDialogOpen(false)
    setName('')
  })
  const updateMut = useUpdateCategory(() => {
    setEditCat(null)
    setName('')
  })
  const deleteMut = useDeleteCategory(() => setDeleteCat(null))

  const columns: ColumnDef<Category>[] = [
    { accessorKey: 'name', header: t('columns.name') },
    {
      accessorKey: '_id',
      header: t('columns.id'),
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original._id}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('common:aria.editItem', { item: t('categories:title') })}
            onClick={() => {
              setEditCat(row.original)
              setName(row.original.name)
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('common:aria.deleteItem', { item: t('categories:title') })}
            onClick={() => setDeleteCat(row.original)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setDialogOpen(true)
              setName('')
            }}
          >
            <Plus className="mr-2 size-4" />
            {t('actions.addCategory')}
          </Button>
        }
      />
      {isError && <ErrorState message={t('error')} onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={categories ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder={t('search')}
      />

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.createCategory')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-cat-name">{t('form.name')}</Label>
              <Input id="create-cat-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createMut.mutate({ name })}
              disabled={!name || createMut.isPending}
            >
              {tc('buttons.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCat} onOpenChange={(o) => !o && setEditCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.editCategory')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-cat-name">{t('form.name')}</Label>
              <Input id="edit-cat-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => editCat && updateMut.mutate({ id: editCat._id, body: { name } })}
              disabled={!name || updateMut.isPending}
            >
              {tc('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteCat}
        onOpenChange={(o) => !o && setDeleteCat(null)}
        title={t('toast.deleteTitle')}
        description={t('toast.deleteDescription', { name: deleteCat?.name })}
        onConfirm={() => deleteCat && deleteMut.mutate(deleteCat._id)}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}
