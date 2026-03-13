import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import categoriesApi from 'src/apis/categories.api'
import type { Category } from 'src/types'

export default function CategoryListPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [deleteCat, setDeleteCat] = useState<Category | null>(null)
  const [name, setName] = useState('')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesApi.getCategories().then((r) => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: (body: { name: string }) => categoriesApi.createCategory(body),
    onSuccess: () => { toast.success('Category created'); setDialogOpen(false); setName(''); qc.invalidateQueries({ queryKey: ['admin-categories'] }) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string } }) => categoriesApi.updateCategory(id, body),
    onSuccess: () => { toast.success('Category updated'); setEditCat(null); setName(''); qc.invalidateQueries({ queryKey: ['admin-categories'] }) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => { toast.success('Category deleted'); setDeleteCat(null); qc.invalidateQueries({ queryKey: ['admin-categories'] }) },
    onError: () => toast.error('Failed to delete. Category may have products.'),
  })

  const columns: ColumnDef<Category>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: '_id', header: 'ID', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original._id}</span> },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setEditCat(row.original); setName(row.original.name) }}><Pencil className="size-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteCat(row.original)}><Trash2 className="size-4 text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Manage product categories" actions={<Button size="sm" onClick={() => { setDialogOpen(true); setName('') }}><Plus className="mr-2 size-4" />Add Category</Button>} />
      <DataTable columns={columns} data={categories ?? []} isLoading={isLoading} searchKey="name" searchPlaceholder="Search categories..." />

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Category</DialogTitle></DialogHeader>
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <DialogFooter><Button onClick={() => createMut.mutate({ name })} disabled={!name || createMut.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCat} onOpenChange={(o) => !o && setEditCat(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <DialogFooter><Button onClick={() => editCat && updateMut.mutate({ id: editCat._id, body: { name } })} disabled={!name || updateMut.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteCat} onOpenChange={(o) => !o && setDeleteCat(null)} title="Delete Category" description={`Delete "${deleteCat?.name}"? Products in this category may be affected.`} onConfirm={() => deleteCat && deleteMut.mutate(deleteCat._id)} isLoading={deleteMut.isPending} />
    </div>
  )
}

