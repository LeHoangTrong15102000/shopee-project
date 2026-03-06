/**
 * Date utility functions for the Shopee Clone application
 */
import i18n from 'src/i18n/i18n'

/**
 * Day i18n keys (indexed by JS getDay(): 0=Sun, 1=Mon, ...)
 */
const DAY_KEYS = ['days.sun', 'days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat']

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
 * Calculate estimated delivery date range
 * @param estimatedDays - e.g., "2-3 ngày" or "3-5 ngày" or "1 ngày"
 * @returns formatted date range string, e.g., "Thứ 3, 11/02 - Thứ 4, 12/02"
 */
export function getEstimatedDeliveryDate(estimatedDays: string): string {
  // Parse the estimatedDays string to extract min and max days
  // e.g., "2-3 ngày" → min=2, max=3
  // e.g., "3-5 ngày" → min=3, max=5
  // e.g., "1 ngày" → min=1, max=1

  const match = estimatedDays.match(/(\d+)(?:\s*-\s*(\d+))?/)
  if (!match) return estimatedDays

  const minDays = parseInt(match[1], 10)
  const maxDays = match[2] ? parseInt(match[2], 10) : minDays

  const now = new Date()
  const minDate = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000)
  const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000)

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
export function getEstimatedDeliveryDateDetails(estimatedDays: string): {
  minDate: Date | null
  maxDate: Date | null
  formatted: string
  minDays: number
  maxDays: number
} {
  const match = estimatedDays.match(/(\d+)(?:\s*-\s*(\d+))?/)
  if (!match) {
    return {
      minDate: null,
      maxDate: null,
      formatted: estimatedDays,
      minDays: 0,
      maxDays: 0
    }
  }

  const minDays = parseInt(match[1], 10)
  const maxDays = match[2] ? parseInt(match[2], 10) : minDays

  const now = new Date()
  const minDate = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000)
  const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000)

  const formatted =
    minDays === maxDays
      ? formatVietnameseDate(minDate)
      : `${formatVietnameseDate(minDate)} - ${formatVietnameseDate(maxDate)}`

  return {
    minDate,
    maxDate,
    formatted,
    minDays,
    maxDays
  }
}
