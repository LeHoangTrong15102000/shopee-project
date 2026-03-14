import { toast } from 'sonner';

interface CsvColumn<T> {
  key: keyof T | string;
  header: string;
  accessor?: (row: T) => string | number;
}

function escapeCSV(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV<T>(data: T[], columns: CsvColumn<T>[], filename: string) {
  if (!data.length) {
    toast.error('No data to export');
    return;
  }

  const header = columns.map((c) => escapeCSV(c.header)).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = col.accessor ? col.accessor(row) : (row[col.key as keyof T] as unknown);
        return escapeCSV(value);
      })
      .join(','),
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${data.length} rows`);
}
