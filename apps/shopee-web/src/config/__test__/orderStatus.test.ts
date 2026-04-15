import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ORDER_STATUS_CONFIG,
  getStatusLabel,
  getStatusClasses,
  CARRIER_DISPLAY_NAMES,
  getCarrierDisplayName,
} from '../orderStatus'
import type { OrderStatus } from 'src/types/orderTracking.type'

// Mock i18n module
vi.mock('src/i18n/i18n', () => ({
  default: {
    t: vi.fn((key: string, options?: { defaultValue?: string }) => {
      return options?.defaultValue ?? key
    }),
  },
}))

describe('orderStatus', () => {
  describe('ORDER_STATUS_CONFIG', () => {
    it('should have all 7 order statuses', () => {
      const expectedStatuses: OrderStatus[] = [
        'pending',
        'confirmed',
        'processing',
        'shipping',
        'delivered',
        'cancelled',
        'returned',
      ]

      expectedStatuses.forEach((status) => {
        expect(ORDER_STATUS_CONFIG[status]).toBeDefined()
      })

      expect(Object.keys(ORDER_STATUS_CONFIG)).toHaveLength(7)
    })

    it('should have required fields for each status', () => {
      const statuses = Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]

      statuses.forEach((status) => {
        const config = ORDER_STATUS_CONFIG[status]

        expect(config.label).toBeDefined()
        expect(typeof config.label).toBe('string')

        expect(config.color).toBeDefined()
        expect(config.color.light).toBeDefined()
        expect(config.color.dark).toBeDefined()

        expect(config.bgColor).toBeDefined()
        expect(config.bgColor.light).toBeDefined()
        expect(config.bgColor.dark).toBeDefined()

        expect(config.borderColor).toBeDefined()
        expect(config.borderColor.light).toBeDefined()
        expect(config.borderColor.dark).toBeDefined()

        expect(config.icon).toBeDefined()
        expect(typeof config.icon).toBe('string')
      })
    })
  })

  describe('getStatusLabel', () => {
    it('should return label for known status', () => {
      const result = getStatusLabel('pending')
      expect(result).toBe('Chờ xác nhận')
    })

    it('should return label for all statuses', () => {
      const statuses: OrderStatus[] = [
        'pending',
        'confirmed',
        'processing',
        'shipping',
        'delivered',
        'cancelled',
        'returned',
      ]

      statuses.forEach((status) => {
        const result = getStatusLabel(status)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
      })
    })
  })

  describe('getStatusClasses', () => {
    it('should return non-empty string for known status', () => {
      const result = getStatusClasses('pending')
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should return empty string for unknown status', () => {
      const result = getStatusClasses('unknown' as OrderStatus)
      expect(result).toBe('')
    })

    it('should include light and dark mode classes', () => {
      const result = getStatusClasses('confirmed')
      expect(result).toContain('text-blue-600')
      expect(result).toContain('dark:text-blue-400')
      expect(result).toContain('bg-blue-50/80')
      expect(result).toContain('dark:bg-blue-900/20')
      expect(result).toContain('border-blue-200/60')
      expect(result).toContain('dark:border-blue-700/30')
    })
  })

  describe('CARRIER_DISPLAY_NAMES', () => {
    it('should have expected carriers', () => {
      const expectedCarriers = ['ghn', 'ghtk', 'viettel_post', 'j&t', 'other']

      expectedCarriers.forEach((carrier) => {
        expect(CARRIER_DISPLAY_NAMES[carrier]).toBeDefined()
        expect(typeof CARRIER_DISPLAY_NAMES[carrier]).toBe('string')
      })
    })

    it('should have correct display names', () => {
      expect(CARRIER_DISPLAY_NAMES.ghn).toBe('Giao Hàng Nhanh')
      expect(CARRIER_DISPLAY_NAMES.ghtk).toBe('Giao Hàng Tiết Kiệm')
      expect(CARRIER_DISPLAY_NAMES.viettel_post).toBe('Viettel Post')
      expect(CARRIER_DISPLAY_NAMES['j&t']).toBe('J&T Express')
      expect(CARRIER_DISPLAY_NAMES.other).toBe('Khác')
    })
  })

  describe('getCarrierDisplayName', () => {
    it('should return name for known carrier', () => {
      const result = getCarrierDisplayName('ghn')
      expect(result).toBe('Giao Hàng Nhanh')
    })

    it('should return carrier code for unknown carrier', () => {
      const unknownCarrier = 'unknown_carrier'
      const result = getCarrierDisplayName(unknownCarrier)
      expect(result).toBe(unknownCarrier)
    })

    it('should return names for all known carriers', () => {
      const carriers = ['ghn', 'ghtk', 'viettel_post', 'j&t', 'other']

      carriers.forEach((carrier) => {
        const result = getCarrierDisplayName(carrier)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
      })
    })
  })
})
