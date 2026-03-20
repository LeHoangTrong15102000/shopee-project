import i18n from '@/config/i18n';

export function formatPrice(price: number): string {
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  return '₫' + price.toLocaleString(locale);
}

export function getDiscountPercent(price: number, original: number): number {
  if (original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}
