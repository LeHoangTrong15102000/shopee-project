import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { PageHeader } from 'src/components/shared/PageHeader';
import { StatCard } from 'src/components/shared/StatCard';
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog';
import { useImportStats, useImportProducts } from 'src/hooks/useImport';

export default function ImportPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: stats } = useImportStats();
  const importMut = useImportProducts(() => setConfirmOpen(false));

  return (
    <div className="space-y-6">
      <PageHeader title="Import" description="Import products from JSON data" />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Products" value={stats.totalProducts} />
          <StatCard label="With Location" value={stats.productsWithLocation} />
          <StatCard label="Locations" value={stats.locationStats?.length ?? 0} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Import Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will import products from the server-side JSON file. All existing products will be
            replaced.
          </p>
          <Button onClick={() => setConfirmOpen(true)} disabled={importMut.isPending}>
            {importMut.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            Import Products
          </Button>
          {importMut.data && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4 text-sm">
                <p className="font-medium">Import Result:</p>
                <p>Imported: {importMut.data.data.data.imported}</p>
                <p>Deleted: {importMut.data.data.data.deleted}</p>
                {importMut.data.data.data.locationStats?.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Location Stats:</p>
                    {importMut.data.data.data.locationStats.map((s) => (
                      <p key={s._id}>
                        {s._id}: {s.count}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Import"
        description="This will delete all existing products and import from the JSON file. This action cannot be undone."
        onConfirm={() => importMut.mutate()}
        isLoading={importMut.isPending}
        confirmText="Import"
      />
    </div>
  );
}
