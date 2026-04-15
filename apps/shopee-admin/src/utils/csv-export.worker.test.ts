import { describe, it, expect, vi, beforeEach } from 'vitest'

// Simulate the worker's escapeCSV and CSV generation logic
// (Worker runs in a separate context, so we test the logic directly)

function escapeCSV(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function generateCSV(
  data: Record<string, unknown>[],
  columns: { key: string; header: string; hasAccessor: boolean }[],
  accessorResults?: string[][],
): string {
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
  return [header, ...rows].join('\n')
}

describe('csv-export worker logic', () => {
  describe('escapeCSV', () => {
    it('returns plain string for simple values', () => {
      expect(escapeCSV('hello')).toBe('hello')
    })

    it('wraps values with commas in double quotes', () => {
      expect(escapeCSV('hello, world')).toBe('"hello, world"')
    })

    it('escapes double quotes by doubling them', () => {
      expect(escapeCSV('say "hi"')).toBe('"say ""hi"""')
    })

    it('wraps values with newlines in double quotes', () => {
      expect(escapeCSV('line1\nline2')).toBe('"line1\nline2"')
    })

    it('converts null/undefined to empty string', () => {
      expect(escapeCSV(null)).toBe('')
      expect(escapeCSV(undefined)).toBe('')
    })

    it('converts numbers to string', () => {
      expect(escapeCSV(42)).toBe('42')
    })
  })

  describe('generateCSV', () => {
    it('generates CSV with header and data rows', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ]
      const columns = [
        { key: 'name', header: 'Name', hasAccessor: false },
        { key: 'age', header: 'Age', hasAccessor: false },
      ]
      const csv = generateCSV(data, columns)
      expect(csv).toBe('Name,Age\nAlice,30\nBob,25')
    })

    it('uses accessorResults when column hasAccessor is true', () => {
      const data = [{ price: 1000 }]
      const columns = [{ key: 'price', header: 'Price', hasAccessor: true }]
      const accessorResults = [['$1,000']]
      const csv = generateCSV(data, columns, accessorResults)
      expect(csv).toContain('"$1,000"') // comma triggers quoting
    })

    it('falls back to direct key access when hasAccessor is false', () => {
      const data = [{ name: 'Test' }]
      const columns = [{ key: 'name', header: 'Name', hasAccessor: false }]
      const accessorResults = [['Ignored']]
      const csv = generateCSV(data, columns, accessorResults)
      expect(csv).toBe('Name\nTest')
    })

    it('handles empty data array', () => {
      const columns = [{ key: 'name', header: 'Name', hasAccessor: false }]
      const csv = generateCSV([], columns)
      expect(csv).toBe('Name')
    })
  })
})
