import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatCard } from 'src/components/shared/StatCard'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { useImportStats, useImportProducts } from 'src/hooks/useImport'

export default function ImportPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation('import')

  const { data: stats } = useImportStats()
  const importMut = useImportProducts(() => {
    setConfirmOpen(false)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setConfirmOpen(true)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={t('stats.totalProducts')} value={stats.totalProducts} />
          <StatCard label={t('stats.withLocation')} value={stats.productsWithLocation} />
          <StatCard label={t('stats.locations')} value={stats.locationStats?.length ?? 0} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('actions.importProducts')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('importDescription')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={importMut.isPending}>
            {importMut.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            {t('actions.importProducts')}
          </Button>
          {importMut.data && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4 text-sm">
                <p className="font-medium">{t('result.title')}</p>
                <p>
                  {t('result.created', { defaultValue: 'Created:' })}{' '}
                  {importMut.data.data.data.created}
                </p>
                <p>
                  {t('result.updated', { defaultValue: 'Updated:' })}{' '}
                  {importMut.data.data.data.updated}
                </p>
                <p>
                  {t('result.failed', { defaultValue: 'Failed:' })}{' '}
                  {importMut.data.data.data.failed}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('confirm.title')}
        description={t('confirm.description')}
        onConfirm={() => {
          if (selectedFile) importMut.mutate(selectedFile)
        }}
        isLoading={importMut.isPending}
        confirmText={t('actions.importProducts')}
      />
    </div>
  )
}
