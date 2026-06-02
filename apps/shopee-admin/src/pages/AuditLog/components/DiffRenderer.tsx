import { useTranslation } from 'react-i18next'
import { Badge } from 'src/components/ui/badge'
import type { AuditLogDiffEntry, AuditLogDiffKind } from 'src/types/audit-log'

interface DiffRendererProps {
  diff: AuditLogDiffEntry[]
}

function kindBadgeClass(kind: AuditLogDiffKind): string {
  switch (kind) {
    case 'N':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'D':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'E':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'A':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function DiffEntry({ entry }: { entry: AuditLogDiffEntry }) {
  const { t } = useTranslation('activity-log')
  const dotPath = entry.path?.join('.') ?? '(root)'
  const kindLabel = t(`diffKinds.${entry.kind}`, { defaultValue: entry.kind })

  return (
    <div className="rounded-md border border-border/60 p-3 space-y-2 text-sm font-mono">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-muted-foreground text-xs">{dotPath}</span>
        <Badge className={`text-xs ${kindBadgeClass(entry.kind)}`} variant="outline">
          {kindLabel}
        </Badge>
      </div>
      {(entry.kind === 'E' || entry.kind === 'D') && entry.lhs !== undefined && (
        <div className="rounded bg-red-50 dark:bg-red-950/30 px-2 py-1 text-red-700 dark:text-red-300 text-xs overflow-auto">
          <span className="font-sans font-medium mr-1">−</span>
          <span className="whitespace-pre-wrap">{formatValue(entry.lhs)}</span>
        </div>
      )}
      {(entry.kind === 'E' || entry.kind === 'N') && entry.rhs !== undefined && (
        <div className="rounded bg-green-50 dark:bg-green-950/30 px-2 py-1 text-green-700 dark:text-green-300 text-xs overflow-auto">
          <span className="font-sans font-medium mr-1">+</span>
          <span className="whitespace-pre-wrap">{formatValue(entry.rhs)}</span>
        </div>
      )}
      {entry.kind === 'A' && entry.item && (
        <div className="ml-2">
          <DiffEntry entry={entry.item} />
        </div>
      )}
    </div>
  )
}

export function DiffRenderer({ diff }: DiffRendererProps) {
  const { t } = useTranslation('activity-log')

  if (!diff || diff.length === 0) {
    return <div className="text-sm text-muted-foreground italic p-4">{t('detail.noDiff')}</div>
  }

  return (
    <div className="space-y-2">
      {diff.map((entry, i) => (
        <DiffEntry key={i} entry={entry} />
      ))}
    </div>
  )
}
