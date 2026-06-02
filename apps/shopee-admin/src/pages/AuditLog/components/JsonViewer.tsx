import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface JsonViewerProps {
  data: unknown
  depth?: number
  defaultExpanded?: boolean
}

function PrimitiveValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-gray-400 italic">null</span>
  }
  if (typeof value === 'boolean') {
    return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>
  }
  if (typeof value === 'number') {
    return <span className="text-blue-600 dark:text-blue-400">{String(value)}</span>
  }
  if (typeof value === 'string') {
    return <span className="text-green-700 dark:text-green-400">&quot;{value}&quot;</span>
  }
  return <span className="text-foreground">{String(value)}</span>
}

function JsonNode({ label, data, depth, defaultExpanded }: JsonViewerProps & { label?: string }) {
  const isExpandable = data !== null && typeof data === 'object'
  const isArray = Array.isArray(data)
  const [expanded, setExpanded] = useState(defaultExpanded ?? depth === 0)

  if (!isExpandable) {
    return (
      <div className="flex items-start gap-1 text-sm font-mono">
        {label !== undefined && <span className="text-foreground/70 shrink-0">{label}:&nbsp;</span>}
        <PrimitiveValue value={data} />
      </div>
    )
  }

  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(data as Record<string, unknown>)

  const openBracket = isArray ? '[' : '{'
  const closeBracket = isArray ? ']' : '}'

  return (
    <div className="text-sm font-mono">
      <button
        type="button"
        className="flex items-center gap-0.5 hover:text-primary transition-colors"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="size-3 shrink-0" />
        ) : (
          <ChevronRight className="size-3 shrink-0" />
        )}
        {label !== undefined && <span className="text-foreground/70">{label}:&nbsp;</span>}
        <span className="text-foreground/50">{openBracket}</span>
        {!expanded && (
          <span className="text-foreground/40 text-xs ml-1">
            {entries.length} {isArray ? 'items' : 'keys'}
          </span>
        )}
        {!expanded && <span className="text-foreground/50">{closeBracket}</span>}
      </button>
      {expanded && (
        <div className="ml-4 border-l border-border/40 pl-3 space-y-0.5">
          {entries.map(([key, value]) => (
            <JsonNode
              key={key}
              label={key}
              data={value}
              depth={(depth ?? 0) + 1}
              defaultExpanded={false}
            />
          ))}
          <div className="text-foreground/50">{closeBracket}</div>
        </div>
      )}
    </div>
  )
}

export function JsonViewer({ data, depth = 0, defaultExpanded = true }: JsonViewerProps) {
  if (data === null || data === undefined) {
    return <div className="text-sm font-mono text-muted-foreground italic p-4">No data</div>
  }

  return (
    <div className="rounded-md bg-muted/40 p-4 overflow-auto max-h-96">
      <JsonNode data={data} depth={depth} defaultExpanded={defaultExpanded} />
    </div>
  )
}
