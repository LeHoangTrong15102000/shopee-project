import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { DataTable } from 'src/components/shared/DataTable';
import { PageHeader } from 'src/components/shared/PageHeader';
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog';
import { ErrorState } from 'src/components/shared/ErrorState';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from 'src/hooks/useCategories';
import type { Category } from 'src/types';

export default function CategoryListPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [name, setName] = useState('');

  const { data: categories, isLoading, isError, refetch } = useCategories();

  const createMut = useCreateCategory(() => {
    setDialogOpen(false);
    setName('');
  });
  const updateMut = useUpdateCategory(() => {
    setEditCat(null);
    setName('');
  });
  const deleteMut = useDeleteCategory(() => setDeleteCat(null));

  const columns: ColumnDef<Category>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: '_id',
      header: 'ID',
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
            aria-label="Edit category"
            onClick={() => {
              setEditCat(row.original);
              setName(row.original.name);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete category"
            onClick={() => setDeleteCat(row.original)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage product categories"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setDialogOpen(true);
              setName('');
            }}
          >
            <Plus className="mr-2 size-4" />
            Add Category
          </Button>
        }
      />
      {isError && <ErrorState message="Failed to load categories" onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={categories ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search categories..."
      />

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="create-cat-name">Name</Label>
            <Input id="create-cat-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => createMut.mutate({ name })}
              disabled={!name || createMut.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCat} onOpenChange={(o) => !o && setEditCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="edit-cat-name">Name</Label>
            <Input id="edit-cat-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => editCat && updateMut.mutate({ id: editCat._id, body: { name } })}
              disabled={!name || updateMut.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteCat}
        onOpenChange={(o) => !o && setDeleteCat(null)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteCat?.name}"? Any products assigned to this category may be affected.`}
        onConfirm={() => deleteCat && deleteMut.mutate(deleteCat._id)}
        isLoading={deleteMut.isPending}
      />
    </div>
  );
}
