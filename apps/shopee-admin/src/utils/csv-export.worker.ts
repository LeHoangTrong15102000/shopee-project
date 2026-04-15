interface CsvColumn {
  key: string
  header: string
  hasAccessor: boolean
}

interface WorkerMessage {
  data: Record<string, unknown>[]
  columns: CsvColumn[]
  accessorResults?: string[][]
}

function escapeCSV(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { data, columns, accessorResults } = e.data

  const header = columns.map((c) => escapeCSV(c.header)).join(',')
  const rows = data.map((row, rowIndex) =>
    columns
      .map((col, colIndex) => {
        const value =
          col.hasAccessor && accessorResults
            ? accessorResults[rowIndex][colIndex]
            : (row[col.key] as unknown)
        return escapeCSV(value)
      })
      .join(','),
  )

  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  self.postMessage({ url })
}
