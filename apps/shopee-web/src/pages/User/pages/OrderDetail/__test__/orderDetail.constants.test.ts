import { describe, it, expect, vi } from 'vitest'
import { getStatusDisplay, paymentMethodLabelKeys, formatDate } from '../orderDetail.constants'

vi.mock('src/styles/animations/motion.config', () => ({
  ANIMATION_DURATION: { fast: 0.15, normal: 0.3 },
  STAGGER_DELAY: { slow: 0.1, normal: 0.05 },
}))

vi.mock('src/config/orderStatus', () => ({
  ORDER_STATUS_CONFIG: {
    pending: {
      color: { light: 'text-yellow-600', dark: 'text-yellow-400' },
      bgColor: { light: 'bg-yellow-50', dark: 'bg-yellow-900/20' },
      icon: 'clock',
    },
    confirmed: {
      color: { light: 'text-blue-600', dark: 'text-blue-400' },
      bgColor: { light: 'bg-blue-50', dark: 'bg-blue-900/20' },
      icon: 'check',
    },
  },
  getStatusLabel: (s: string) => {
    const m: Record<string, string> = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận' }
    return m[s] || s
  },
}))

describe('orderDetail.constants', () => {
  describe('getStatusDisplay', () => {
    it('returns config for known status', () => {
      const result = getStatusDisplay('pending' as any)
      expect(result.label).toBe('Chờ xác nhận')
      expect(result.icon).toBe('clock')
    })

    it('returns config for confirmed status', () => {
      const result = getStatusDisplay('confirmed' as any)
      expect(result.label).toBe('Đã xác nhận')
      expect(result.icon).toBe('check')
    })

    it('returns fallback for unknown status', () => {
      const result = getStatusDisplay('unknown_status' as any)
      expect(result.label).toBe('unknown_status')
      expect(result.color).toContain('text-gray-700')
      expect(result.bgColor).toContain('bg-gray-100')
    })
  })

  describe('paymentMethodLabelKeys', () => {
    it('has cod label', () => {
      expect(paymentMethodLabelKeys.cod).toBe('payment:method.cod')
    })
    it('has bank_transfer label', () => {
      expect(paymentMethodLabelKeys.bank_transfer).toBe('payment:method.bankTransfer')
    })
    it('has e_wallet label', () => {
      expect(paymentMethodLabelKeys.e_wallet).toBe('payment:method.eWallet')
    })
    it('has credit_card label', () => {
      expect(paymentMethodLabelKeys.credit_card).toBe('payment:method.creditCard')
    })
  })

  describe('formatDate', () => {
    it('formats date in Vietnamese locale', () => {
      const result = formatDate('2026-03-19T08:00:00Z')
      expect(result).toMatch(/2026/)
      expect(result).toMatch(/3|tháng/i)
    })
  })
})
