import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ErrorState } from 'src/components/shared/ErrorState'
import { useAuditLogDetail } from 'src/hooks/useAuditLog'
import { JsonViewer } from './components/JsonViewer'
import { DiffRenderer } from './components/DiffRenderer'
import { ROUTES } from 'src/constants/routes'

export default function AuditLogDetailPage() {
  const { t } = useTranslation('activity-log')
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: entry, isLoading, error } = useAuditLogDetail(id)

  if (isLoading) return <LoadingState />
  if (error || !entry) return <ErrorState message={t('notFound')} />

  const hasDiff = !!(
    entry.before !== null ||
    entry.after !== null ||
    (entry.diff && entry.diff.length > 0)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('detail.action')}: ${entry.action}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.AUDIT_LOG)}>
            <ArrowLeft className="mr-2 size-4" />
            {t('detail.back')}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <MetaRow label={t('detail.id')} value={entry._id} mono />
          <MetaRow label={t('detail.action')} value={entry.action} mono />
          <MetaRow label={t('detail.resource')} value={entry.resource} />
          {entry.resourceId && (
            <MetaRow label={t('detail.resourceId')} value={entry.resourceId} mono />
          )}
          <MetaRow label={t('detail.actorId')} value={entry.actor.userId} mono />
          <MetaRow label={t('detail.actorRoles')} value={entry.actor.roles.join(', ')} />
          <MetaRow label={t('detail.ip')} value={entry.ip} mono />
          {entry.userAgent && <MetaRow label={t('detail.userAgent')} value={entry.userAgent} />}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.status')}</span>
            <StatusBadge status={entry.status} />
          </div>
          <MetaRow
            label={t('detail.timestamp')}
            value={format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm:ss')}
          />
        </CardContent>
      </Card>

      {entry.status === 'failed' && entry.errorMessage && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-sm">{t('detail.errorMessage')}</p>
            <p className="font-mono text-xs break-all">{entry.errorMessage}</p>
          </div>
        </div>
      )}

      {hasDiff && (
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.diffTabs.changes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="before">
              <TabsList>
                <TabsTrigger value="before">{t('detail.diffTabs.before')}</TabsTrigger>
                <TabsTrigger value="after">{t('detail.diffTabs.after')}</TabsTrigger>
                <TabsTrigger value="changes">{t('detail.diffTabs.changes')}</TabsTrigger>
              </TabsList>
              <TabsContent value="before" className="mt-4">
                <JsonViewer data={entry.before ?? null} />
              </TabsContent>
              <TabsContent value="after" className="mt-4">
                <JsonViewer data={entry.after ?? null} />
              </TabsContent>
              <TabsContent value="changes" className="mt-4">
                <DiffRenderer diff={entry.diff ?? []} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
