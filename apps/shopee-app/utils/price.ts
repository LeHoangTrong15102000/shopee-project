import i18n from '@/config/i18n'

export interface FormatPriceOptions {
  compact?: boolean
}

export function formatPrice(price: number, options?: FormatPriceOptions): string {
  if (options?.compact) {
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`
    if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`
    return String(price)
  }
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US'
  return '₫' + price.toLocaleString(locale)
}

export function getDiscountPercent(price: number, original: number): number {
  if (original <= price) return 0
  return Math.round(((original - price) / original) * 100)
}
