import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PaymentStatusBadge from '../PaymentStatusBadge'

// The global vitest.setup.js already mocks react-i18next with real translations.
// The order.json locale file has paymentStatus keys, so the global mock will resolve them.
// We override here to keep tests self-contained and predictable.
const tMock = vi.fn((key: string) => key)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tMock,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}))

describe('PaymentStatusBadge', () => {
  describe('returns null for non-credit_card payment methods', () => {
    it('returns null for cod payment method', () => {
      const { container } = render(
        <PaymentStatusBadge paymentStatus="paid" paymentMethod="cod" />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('returns null for bank_transfer payment method', () => {
      const { container } = render(
        <PaymentStatusBadge paymentStatus="paid" paymentMethod="bank_transfer" />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('returns null for e_wallet payment method', () => {
      const { container } = render(
        <PaymentStatusBadge paymentStatus="paid" paymentMethod="e_wallet" />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('returns null for undefined payment method', () => {
      const { container } = render(
        <PaymentStatusBadge paymentStatus="paid" paymentMethod={undefined} />,
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('returns null for missing or unknown payment status', () => {
    it('returns null when paymentStatus is undefined', () => {
      const { container } = render(
        <PaymentStatusBadge paymentStatus={undefined} paymentMethod="credit_card" />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('returns null for unknown status value', () => {
      const { container } = render(
        <PaymentStatusBadge paymentStatus="unknown_status" paymentMethod="credit_card" />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('returns null for empty string status', () => {
      const { container } = render(
        <PaymentStatusBadge paymentStatus="" paymentMethod="credit_card" />,
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('renders badge for credit_card with known statuses', () => {
    it('renders badge for pending status with yellow color classes', () => {
      render(<PaymentStatusBadge paymentStatus="pending" paymentMethod="credit_card" />)
      const badge = screen.getByText('paymentStatus.pending')
      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain('bg-yellow-100')
      expect(badge.className).toContain('text-yellow-800')
    })

    it('renders badge for processing status with blue color classes', () => {
      render(<PaymentStatusBadge paymentStatus="processing" paymentMethod="credit_card" />)
      const badge = screen.getByText('paymentStatus.processing')
      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain('bg-blue-100')
      expect(badge.className).toContain('text-blue-800')
    })

    it('renders badge for paid status with green color classes', () => {
      render(<PaymentStatusBadge paymentStatus="paid" paymentMethod="credit_card" />)
      const badge = screen.getByText('paymentStatus.paid')
      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain('bg-green-100')
      expect(badge.className).toContain('text-green-800')
    })

    it('renders badge for failed status with red color classes', () => {
      render(<PaymentStatusBadge paymentStatus="failed" paymentMethod="credit_card" />)
      const badge = screen.getByText('paymentStatus.failed')
      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain('bg-red-100')
      expect(badge.className).toContain('text-red-800')
    })

    it('renders badge for refunded status with gray color classes', () => {
      render(<PaymentStatusBadge paymentStatus="refunded" paymentMethod="credit_card" />)
      const badge = screen.getByText('paymentStatus.refunded')
      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain('bg-gray-100')
      expect(badge.className).toContain('text-gray-800')
    })
  })

  describe('uses i18n translation keys', () => {
    it('calls t() with the correct i18n key for each status', () => {
      tMock.mockClear()
      render(<PaymentStatusBadge paymentStatus="paid" paymentMethod="credit_card" />)
      expect(tMock).toHaveBeenCalledWith('paymentStatus.paid')
    })

    it('calls t() with pending key', () => {
      tMock.mockClear()
      render(<PaymentStatusBadge paymentStatus="pending" paymentMethod="credit_card" />)
      expect(tMock).toHaveBeenCalledWith('paymentStatus.pending')
    })

    it('renders badge as a span element', () => {
      render(<PaymentStatusBadge paymentStatus="paid" paymentMethod="credit_card" />)
      const badge = screen.getByText('paymentStatus.paid')
      expect(badge.tagName.toLowerCase()).toBe('span')
    })
  })
})
