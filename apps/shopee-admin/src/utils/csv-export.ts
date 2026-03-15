import { toast } from 'sonner';
import { format } from 'date-fns';
import i18n from 'src/i18n/i18n';

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
    toast.error(i18n.t('csv.noData', { ns: 'common' }));
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
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(i18n.t('csv.exported', { ns: 'common', count: data.length }));
}
