import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { PageHeader } from 'src/components/shared/PageHeader'
import { EmptyState } from 'src/components/shared/EmptyState'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { Button } from 'src/components/ui/button'
import { Card, CardContent } from 'src/components/ui/card'
import { useActivityLogStore, type ActivityLogEntry } from 'src/stores/activity-log.store'
import { useState } from 'react'

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
}

function groupByDate(entries: ActivityLogEntry[]) {
  const groups: Record<string, ActivityLogEntry[]> = {}
  for (const entry of entries) {
    const date = format(new Date(entry.timestamp), 'yyyy-MM-dd')
    ;(groups[date] ??= []).push(entry)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

export default function ActivityLogPage() {
  const { entries, clearLog } = useActivityLogStore()
  const [clearOpen, setClearOpen] = useState(false)
  const { t } = useTranslation('activity-log')
  const grouped = groupByDate(entries)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          entries.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => setClearOpen(true)}>
              {t('actions.clearLog')}
            </Button>
          ) : undefined
        }
      />
      {entries.length === 0 ? (
        <EmptyState
          title={t('empty.title')}
          description={t('empty.description')}
          icon={<FileText className="size-12" />}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h2>
              <Card>
                <CardContent className="divide-y">
                  {items.map((entry) => {
                    const Icon = actionIcons[entry.action] ?? FileText
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium capitalize">{entry.action}</span>{' '}
                            <span className="text-muted-foreground">{entry.entityType}</span>{' '}
                            <span className="font-medium">{entry.entityName}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.adminEmail}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.timestamp), 'HH:mm')}
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title={t('confirm.title')}
        description={t('confirm.description')}
        onConfirm={() => {
          clearLog()
          setClearOpen(false)
        }}
      />
    </div>
  )
}
