/// <reference types="jest" />
import {
  periodSchema,
  dateRangeQuerySchema,
  adminPaginationQuerySchema,
  periodDateRangeQuerySchema,
  limitQuerySchema,
  sortQuerySchema,
  searchQuerySchema,
  getDateRangeFromPeriod,
  getGroupingForPeriod,
} from '@schemas/admin-common.schema'

describe('Admin Common Schemas', () => {
  describe('periodSchema', () => {
    it('should accept valid periods', () => {
      for (const p of ['today', '7d', '30d', '90d', '1y']) {
        expect(periodSchema.safeParse(p).success).toBe(true)
      }
    })
    it('should reject invalid period', () => {
      expect(periodSchema.safeParse('2d').success).toBe(false)
    })
  })

  describe('dateRangeQuerySchema', () => {
    it('should accept valid date range', () => {
      expect(
        dateRangeQuerySchema.safeParse({ start_date: '2024-01-01', end_date: '2024-12-31' })
          .success,
      ).toBe(true)
    })
    it('should accept empty (both optional)', () => {
      expect(dateRangeQuerySchema.safeParse({}).success).toBe(true)
    })
    it('should reject invalid date format', () => {
      expect(dateRangeQuerySchema.safeParse({ start_date: '01-01-2024' }).success).toBe(false)
    })
  })

  describe('adminPaginationQuerySchema', () => {
    it('should accept valid pagination', () => {
      const r = adminPaginationQuerySchema.safeParse({ page: 2, limit: 50 })
      expect(r.success).toBe(true)
    })
    it('should use defaults', () => {
      const r = adminPaginationQuerySchema.safeParse({})
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.page).toBe(1)
        expect(r.data.limit).toBe(20)
      }
    })
    it('should reject page 0', () => {
      expect(adminPaginationQuerySchema.safeParse({ page: 0 }).success).toBe(false)
    })
    it('should reject limit > 100', () => {
      expect(adminPaginationQuerySchema.safeParse({ limit: 101 }).success).toBe(false)
    })
  })

  describe('periodDateRangeQuerySchema', () => {
    it('should accept period only', () => {
      expect(periodDateRangeQuerySchema.safeParse({ period: '7d' }).success).toBe(true)
    })
    it('should reject start_date after end_date', () => {
      expect(
        periodDateRangeQuerySchema.safeParse({ start_date: '2024-12-31', end_date: '2024-01-01' })
          .success,
      ).toBe(false)
    })
  })

  describe('limitQuerySchema', () => {
    it('should default to 10', () => {
      const r = limitQuerySchema.safeParse({})
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.limit).toBe(10)
    })
    it('should reject limit > 100', () => {
      expect(limitQuerySchema.safeParse({ limit: 101 }).success).toBe(false)
    })
  })

  describe('sortQuerySchema', () => {
    it('should accept valid sort', () => {
      expect(sortQuerySchema.safeParse({ sort_by: 'created_at', order: 'asc' }).success).toBe(true)
    })
    it('should reject invalid order', () => {
      expect(sortQuerySchema.safeParse({ order: 'random' }).success).toBe(false)
    })
  })

  describe('searchQuerySchema', () => {
    it('should accept search string', () => {
      expect(searchQuerySchema.safeParse({ search: 'test' }).success).toBe(true)
    })
    it('should accept empty', () => {
      expect(searchQuerySchema.safeParse({}).success).toBe(true)
    })
  })

  describe('getDateRangeFromPeriod', () => {
    it('should return date range for explicit dates', () => {
      const r = getDateRangeFromPeriod(undefined, '2024-01-01', '2024-12-31')
      expect(r.start).toBeInstanceOf(Date)
      expect(r.end).toBeInstanceOf(Date)
    })
    it('should return date range for period', () => {
      const r = getDateRangeFromPeriod('7d')
      expect(r.start).toBeInstanceOf(Date)
      expect(r.end).toBeInstanceOf(Date)
      expect(r.end.getTime()).toBeGreaterThan(r.start.getTime())
    })
    it('should default to 30d', () => {
      const r = getDateRangeFromPeriod()
      expect(r.start).toBeInstanceOf(Date)
    })
  })

  describe('getGroupingForPeriod', () => {
    it('should return hour for today', () => {
      expect(getGroupingForPeriod('today').interval).toBe('hour')
    })
    it('should return day for 7d', () => {
      expect(getGroupingForPeriod('7d').interval).toBe('day')
    })
    it('should return week for 90d', () => {
      expect(getGroupingForPeriod('90d').interval).toBe('week')
    })
    it('should return month for 1y', () => {
      expect(getGroupingForPeriod('1y').interval).toBe('month')
    })
    it('should default to day', () => {
      expect(getGroupingForPeriod().interval).toBe('day')
    })
  })
})
