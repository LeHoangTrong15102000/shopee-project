import { describe, it, expect, vi } from 'vitest'

// Mock i18n
vi.mock('src/i18n/i18n', () => ({
  default: {
    t: (key: string) => {
      const map: Record<string, string> = {
        'common:days.sun': 'CN',
        'common:days.mon': 'T2',
        'common:days.tue': 'T3',
        'common:days.wed': 'T4',
        'common:days.thu': 'T5',
        'common:days.fri': 'T6',
        'common:days.sat': 'T7',
      }
      return map[key] || key
    },
  },
}))

import {
  formatVietnameseDate,
  getEstimatedDeliveryDate,
  getEstimatedDeliveryDateDetails,
  getShopeeDeliveryRange,
} from '../date'

describe('date utils', () => {
  describe('formatVietnameseDate', () => {
    it('should format date with day name', () => {
      const date = new Date(2024, 0, 15) // Monday Jan 15
      const result = formatVietnameseDate(date)
      expect(result).toContain('15/01')
    })

    it('should format date with correct day name for Sunday', () => {
      const date = new Date(2024, 0, 14) // Sunday Jan 14
      const result = formatVietnameseDate(date)
      expect(result).toContain('CN')
      expect(result).toContain('14/01')
    })

    it('should format date with correct day name for Saturday', () => {
      const date = new Date(2024, 0, 13) // Saturday Jan 13
      const result = formatVietnameseDate(date)
      expect(result).toContain('T7')
      expect(result).toContain('13/01')
    })

    it('should pad single digit dates', () => {
      const date = new Date(2024, 0, 5) // Jan 5
      const result = formatVietnameseDate(date)
      expect(result).toContain('05/01')
    })

    it('should pad single digit months', () => {
      const date = new Date(2024, 8, 15) // Sep 15
      const result = formatVietnameseDate(date)
      expect(result).toContain('15/09')
    })
  })

  describe('getEstimatedDeliveryDate', () => {
    it('should return range for "2-3 ngày"', () => {
      const result = getEstimatedDeliveryDate('2-3 ngày')
      expect(result).toContain(' - ')
    })

    it('should return single date for "1 ngày"', () => {
      const result = getEstimatedDeliveryDate('1 ngày')
      expect(result).not.toContain(' - ')
    })

    it('should return input for unparseable string', () => {
      expect(getEstimatedDeliveryDate('unknown')).toBe('unknown')
    })

    it('should handle range with spaces', () => {
      const result = getEstimatedDeliveryDate('3 - 5 ngày')
      expect(result).toContain(' - ')
    })

    it('should handle range without spaces', () => {
      const result = getEstimatedDeliveryDate('3-5 ngày')
      expect(result).toContain(' - ')
    })

    it('should return same date when min equals max', () => {
      const result = getEstimatedDeliveryDate('2 ngày')
      expect(result).not.toContain(' - ')
    })
  })

  describe('getEstimatedDeliveryDateDetails', () => {
    it('should return details for valid range', () => {
      const result = getEstimatedDeliveryDateDetails('3-5 ngày')
      expect(result.minDays).toBe(3)
      expect(result.maxDays).toBe(5)
      expect(result.minDate).toBeInstanceOf(Date)
      expect(result.maxDate).toBeInstanceOf(Date)
    })

    it('should return null dates for unparseable string', () => {
      const result = getEstimatedDeliveryDateDetails('unknown')
      expect(result.minDate).toBeNull()
      expect(result.maxDate).toBeNull()
      expect(result.minDays).toBe(0)
    })

    it('should handle single day', () => {
      const result = getEstimatedDeliveryDateDetails('1 ngày')
      expect(result.minDays).toBe(1)
      expect(result.maxDays).toBe(1)
    })

    it('should return formatted string for single day', () => {
      const result = getEstimatedDeliveryDateDetails('2 ngày')
      expect(result.formatted).not.toContain(' - ')
    })

    it('should return formatted string for range', () => {
      const result = getEstimatedDeliveryDateDetails('2-4 ngày')
      expect(result.formatted).toContain(' - ')
    })

    it('should calculate correct dates', () => {
      const now = new Date()
      const result = getEstimatedDeliveryDateDetails('2-3 ngày')
      const expectedMinDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      const expectedMaxDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

      expect(result.minDate?.getDate()).toBe(expectedMinDate.getDate())
      expect(result.maxDate?.getDate()).toBe(expectedMaxDate.getDate())
    })

    it('should return original string in formatted when unparseable', () => {
      const result = getEstimatedDeliveryDateDetails('invalid input')
      expect(result.formatted).toBe('invalid input')
    })
  })

  describe('getShopeeDeliveryRange', () => {
    it('should return Shopee-style range', () => {
      const result = getShopeeDeliveryRange('2-4 ngày')
      expect(result).toContain('Th')
      expect(result).toContain(' - ')
    })

    it('should return single date for same min/max', () => {
      const result = getShopeeDeliveryRange('3 ngày')
      expect(result).toContain('Th')
      expect(result).not.toContain(' - ')
    })

    it('should return input for unparseable', () => {
      expect(getShopeeDeliveryRange('abc')).toBe('abc')
    })

    it('should format date without leading zero', () => {
      const result = getShopeeDeliveryRange('1 ngày')
      // Should not have leading zero for day
      expect(result).toMatch(/^\d{1,2} Th\d{2}$/)
    })

    it('should format month with leading zero', () => {
      const result = getShopeeDeliveryRange('1 ngày')
      // Month should have leading zero
      expect(result).toMatch(/Th\d{2}/)
    })

    it('should handle large day ranges', () => {
      const result = getShopeeDeliveryRange('10-15 ngày')
      expect(result).toContain(' - ')
      expect(result).toContain('Th')
    })
  })
})
