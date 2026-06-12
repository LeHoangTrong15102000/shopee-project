/**
 * Date utility functions for the Shopee Clone application
 */
import i18n from 'src/i18n/i18n'

/**
 * Day i18n keys (indexed by JS getDay(): 0=Sun, 1=Mon, ...)
 */
const DAY_KEYS = [
  'days.sun',
  'days.mon',
  'days.tue',
  'days.wed',
  'days.thu',
  'days.fri',
  'days.sat',
]

/**
 * Format a date with localized day name
 * @param date - Date object to format
 * @returns formatted string, e.g., "Tue, 11/02" or "Thứ 3, 11/02"
 */
export function formatVietnameseDate(date: Date): string {
  const dayName = i18n.t(`common:${DAY_KEYS[date.getDay()]}` as never)
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dayName}, ${dd}/${mm}`
}

/**
 * Parse estimatedDays string → { minDays, maxDays, minDate, maxDate }
 * Shared by all delivery date formatters.
 */
function parseDeliveryDays(estimatedDays: string | undefined): {
  minDays: number
  maxDays: number
  minDate: Date
  maxDate: Date
} | null {
  if (typeof estimatedDays !== 'string' || estimatedDays.length === 0) return null
  const match = estimatedDays.match(/(\d+)(?:\s*-\s*(\d+))?/)
  if (!match) return null

  const minDays = parseInt(match[1], 10)
  const maxDays = match[2] ? parseInt(match[2], 10) : minDays
  const now = new Date()
  const minDate = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000)
  const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000)

  return { minDays, maxDays, minDate, maxDate }
}

/**
 * Calculate estimated delivery date range
 * @param estimatedDays - e.g., "2-3 ngày" or "3-5 ngày" or "1 ngày"
 * @returns formatted date range string, e.g., "Thứ 3, 11/02 - Thứ 4, 12/02"
 */
export function getEstimatedDeliveryDate(estimatedDays: string | undefined): string {
  const parsed = parseDeliveryDays(estimatedDays)
  if (!parsed) return estimatedDays ?? ''

  const { minDays, maxDays, minDate, maxDate } = parsed
  if (minDays === maxDays) {
    return formatVietnameseDate(minDate)
  }
  return `${formatVietnameseDate(minDate)} - ${formatVietnameseDate(maxDate)}`
}

/**
 * Get estimated delivery date object with min and max dates
 * @param estimatedDays - e.g., "2-3 ngày" or "3-5 ngày" or "1 ngày"
 * @returns object with minDate, maxDate, and formatted string
 */
export function getEstimatedDeliveryDateDetails(estimatedDays: string | undefined): {
  minDate: Date | null
  maxDate: Date | null
  formatted: string
  minDays: number
  maxDays: number
} {
  const parsed = parseDeliveryDays(estimatedDays)
  if (!parsed) {
    return {
      minDate: null,
      maxDate: null,
      formatted: estimatedDays ?? '',
      minDays: 0,
      maxDays: 0,
    }
  }

  const { minDays, maxDays, minDate, maxDate } = parsed
  const formatted =
    minDays === maxDays
      ? formatVietnameseDate(minDate)
      : `${formatVietnameseDate(minDate)} - ${formatVietnameseDate(maxDate)}`

  return { minDate, maxDate, formatted, minDays, maxDays }
}

/**
 * Format date theo kiểu Shopee chính thống: "13 Th03"
 */
function formatShopeeDate(date: Date): string {
  const dd = date.getDate()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd} Th${mm}`
}

/**
 * Parse estimatedDays string → Shopee-style date range: "13 Th03 - 16 Th03"
 */
export function getShopeeDeliveryRange(estimatedDays: string | undefined): string {
  const parsed = parseDeliveryDays(estimatedDays)
  if (!parsed) return estimatedDays ?? ''

  const { minDays, maxDays, minDate, maxDate } = parsed
  if (minDays === maxDays) return formatShopeeDate(minDate)
  return `${formatShopeeDate(minDate)} - ${formatShopeeDate(maxDate)}`
}
