export function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value);
}

export function formatPrice(value: number | string): string {
  return `₫${Number(value).toLocaleString('vi-VN')}`;
}

export function formatVNDCurrency(value: number | string): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value));
}

export function formatNumberToSocialStyle(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  })
    .format(value)
    .replace('.', ',')
    .toLowerCase();
}

export const rateSale = (original: number, sale: number): string => {
  return Math.round(((original - sale) / original) * 100) + '%';
};

export function formatDiscount(discountType: string, discountValue: number): string {
  return discountType === 'percentage' ? `${discountValue}%` : `₫${formatNumber(discountValue)}`;
}

