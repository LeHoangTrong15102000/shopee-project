export function formatCurrency(value: number | string): string {
  return `₫${Number(value).toLocaleString('vi-VN')}`;
}
