import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoucherCard from '../VoucherCard/VoucherCard'
import { Voucher } from 'src/types/voucher.type'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'voucher.discount': 'Discount',
        'voucher.maxDiscount': `Max ${params?.amount}`,
        'voucher.minOrder': `Min order ${params?.amount}`,
        'voucher.code': `Code: ${params?.code}`,
        'voucher.expired': 'Expired',
        'voucher.expiringToday': 'Expiring today',
        'voucher.expiryDate': `Valid until ${params?.date}`,
        'voucher.processing': 'Processing...',
        'voucher.saved': 'Saved',
        'voucher.apply': 'Apply',
        'voucher.save': 'Save',
        'voucher.expiredOverlay': 'EXPIRED',
        'voucher.ariaCard': `Voucher ${params?.name} with ${params?.discount} discount`,
        'voucher.ariaExpired': `${params?.name} voucher is expired`,
        'voucher.ariaProcessing': 'Processing voucher',
        'voucher.ariaSaved': `${params?.name} voucher is saved`,
        'voucher.ariaApply': `Apply ${params?.name} voucher with ${params?.discount} discount`,
        'voucher.ariaSave': `Save ${params?.name} voucher with ${params?.discount} discount`,
      }
      return translations[key] || key
    },
  }),
}))

vi.mock('src/utils/utils', () => ({
  formatCurrency: (value: number) => `$${value}`,
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
  formatDiscount: (type: string, value: number) =>
    type === 'percentage' ? `${value}%` : `$${value}`,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

describe('VoucherCard', () => {
  const mockVoucher: Pick<
    Voucher,
    | '_id'
    | 'code'
    | 'name'
    | 'description'
    | 'discount_type'
    | 'discount_value'
    | 'min_order_value'
    | 'max_discount'
    | 'end_date'
    | 'is_active'
  > = {
    _id: 'voucher-1',
    code: 'SAVE20',
    name: 'Spring Sale',
    description: 'Get 20% off on all items',
    discount_type: 'percentage',
    discount_value: 20,
    min_order_value: 50,
    max_discount: 100,
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    is_active: true,
  }

  const mockOnSave = vi.fn()
  const mockOnApply = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render voucher card with all basic information', () => {
      render(<VoucherCard voucher={mockVoucher} />)

      expect(screen.getByText('Spring Sale')).toBeInTheDocument()
      expect(screen.getByText('Get 20% off on all items')).toBeInTheDocument()
      expect(screen.getByText('Code: SAVE20')).toBeInTheDocument()
      expect(screen.getByText('20%')).toBeInTheDocument()
    })

    it('should render with percentage discount and max discount', () => {
      render(<VoucherCard voucher={mockVoucher} />)

      expect(screen.getByText('20%')).toBeInTheDocument()
      expect(screen.getByText('Max $100')).toBeInTheDocument()
    })

    it('should render with fixed amount discount without max discount', () => {
      const fixedVoucher = {
        ...mockVoucher,
        discount_type: 'fixed_amount' as const,
        discount_value: 15,
        max_discount: undefined,
      }

      render(<VoucherCard voucher={fixedVoucher} />)

      expect(screen.getByText('$15')).toBeInTheDocument()
      expect(screen.queryByText(/Max/)).not.toBeInTheDocument()
    })

    it('should render minimum order value', () => {
      render(<VoucherCard voucher={mockVoucher} />)

      expect(screen.getByText('Min order $50')).toBeInTheDocument()
    })

    it('should have proper ARIA attributes', () => {
      render(<VoucherCard voucher={mockVoucher} />)

      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-label', 'Voucher Spring Sale with 20% discount')
    })
  })

  describe('Voucher Status', () => {
    it('should show active status for valid voucher', () => {
      render(<VoucherCard voucher={mockVoucher} />)

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Save')
      expect(button).not.toBeDisabled()
    })

    it('should show expired status for inactive voucher', () => {
      const expiredVoucher = { ...mockVoucher, is_active: false }

      render(<VoucherCard voucher={expiredVoucher} />)

      expect(screen.getByText('EXPIRED')).toBeInTheDocument()
      expect(screen.getByText('Expired')).toBeInTheDocument()
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should show expired status for past end date', () => {
      const expiredVoucher = {
        ...mockVoucher,
        end_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      }

      render(<VoucherCard voucher={expiredVoucher} />)

      expect(screen.getByText('EXPIRED')).toBeInTheDocument()
      expect(screen.getByText('Expired')).toBeInTheDocument()
    })

    it('should show saved status when isSaved is true', () => {
      render(<VoucherCard voucher={mockVoucher} isSaved={true} onApply={mockOnApply} />)

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Apply')
    })

    it('should show saved without apply button when isSaved but no onApply', () => {
      render(<VoucherCard voucher={mockVoucher} isSaved={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Saved')
      expect(button).toBeDisabled()
    })
  })

  describe('Days Remaining', () => {
    it('should show expiry date for vouchers with more than 3 days remaining', () => {
      render(<VoucherCard voucher={mockVoucher} />)

      const expiryText = screen.getByText(/Valid until/)
      expect(expiryText).toBeInTheDocument()
      expect(expiryText).not.toHaveClass('text-red-500')
    })

    it('should show warning for vouchers expiring in 3 days or less', () => {
      const soonExpiring = {
        ...mockVoucher,
        end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      }

      render(<VoucherCard voucher={soonExpiring} />)

      const expiryText = screen.getByText(/Valid until/)
      expect(expiryText).toHaveClass('text-red-500')
    })

    it('should show "expiring today" for vouchers expiring today', () => {
      const expiringToday = {
        ...mockVoucher,
        end_date: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
      }

      render(<VoucherCard voucher={expiringToday} />)

      expect(screen.getByText('Expiring today')).toBeInTheDocument()
    })
  })

  describe('Button Interactions', () => {
    it('should call onSave when save button is clicked', async () => {
      const user = userEvent.setup()
      render(<VoucherCard voucher={mockVoucher} onSave={mockOnSave} />)

      const button = screen.getByRole('button', { name: /Save/ })
      await user.click(button)

      expect(mockOnSave).toHaveBeenCalledWith('voucher-1')
      expect(mockOnSave).toHaveBeenCalledTimes(1)
    })

    it('should call onApply when apply button is clicked on saved voucher', async () => {
      const user = userEvent.setup()
      render(<VoucherCard voucher={mockVoucher} isSaved={true} onApply={mockOnApply} />)

      const button = screen.getByRole('button', { name: /Apply/ })
      await user.click(button)

      expect(mockOnApply).toHaveBeenCalledWith('SAVE20')
      expect(mockOnApply).toHaveBeenCalledTimes(1)
    })

    it('should not call handlers when button is disabled (expired)', async () => {
      const user = userEvent.setup()
      const expiredVoucher = { ...mockVoucher, is_active: false }

      render(<VoucherCard voucher={expiredVoucher} onSave={mockOnSave} onApply={mockOnApply} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockOnSave).not.toHaveBeenCalled()
      expect(mockOnApply).not.toHaveBeenCalled()
    })

    it('should not call handlers when isLoading is true', async () => {
      const user = userEvent.setup()
      render(<VoucherCard voucher={mockVoucher} onSave={mockOnSave} isLoading={true} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should not call handlers when saved without onApply', async () => {
      const user = userEvent.setup()
      render(<VoucherCard voucher={mockVoucher} isSaved={true} onSave={mockOnSave} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should show processing text when isLoading is true', () => {
      render(<VoucherCard voucher={mockVoucher} isLoading={true} />)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('should disable button when isLoading is true', () => {
      render(<VoucherCard voucher={mockVoucher} isLoading={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('opacity-50')
    })

    it('should have correct aria-label when loading', () => {
      render(<VoucherCard voucher={mockVoucher} isLoading={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Processing voucher')
    })
  })

  describe('Styling and Classes', () => {
    it('should apply opacity for expired vouchers', () => {
      const expiredVoucher = { ...mockVoucher, is_active: false }

      render(<VoucherCard voucher={expiredVoucher} />)

      const article = screen.getByRole('article')
      expect(article).toHaveClass('opacity-60')
    })

    it('should apply hover shadow for active vouchers', () => {
      render(<VoucherCard voucher={mockVoucher} />)

      const article = screen.getByRole('article')
      expect(article).toHaveClass('hover:shadow-md')
    })

    it('should not apply hover shadow for expired vouchers', () => {
      const expiredVoucher = { ...mockVoucher, is_active: false }

      render(<VoucherCard voucher={expiredVoucher} />)

      const article = screen.getByRole('article')
      expect(article).not.toHaveClass('hover:shadow-md')
    })

    it('should apply correct button styles for unsaved active voucher', () => {
      render(<VoucherCard voucher={mockVoucher} onSave={mockOnSave} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-orange', 'text-white')
    })

    it('should apply correct button styles for saved voucher with apply', () => {
      render(<VoucherCard voucher={mockVoucher} isSaved={true} onApply={mockOnApply} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-orange', 'text-orange')
    })

    it('should apply correct button styles for saved voucher without apply', () => {
      render(<VoucherCard voucher={mockVoucher} isSaved={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-gray-300', 'text-gray-400')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label for save button', () => {
      render(<VoucherCard voucher={mockVoucher} onSave={mockOnSave} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Save Spring Sale voucher with 20% discount')
    })

    it('should have proper aria-label for apply button', () => {
      render(<VoucherCard voucher={mockVoucher} isSaved={true} onApply={mockOnApply} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Apply Spring Sale voucher with 20% discount')
    })

    it('should have proper aria-label for saved button', () => {
      render(<VoucherCard voucher={mockVoucher} isSaved={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Spring Sale voucher is saved')
    })

    it('should have proper aria-label for expired voucher', () => {
      const expiredVoucher = { ...mockVoucher, is_active: false }

      render(<VoucherCard voucher={expiredVoucher} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Spring Sale voucher is expired')
    })

    it('should have aria-disabled attribute when disabled', () => {
      render(<VoucherCard voucher={mockVoucher} isLoading={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Memoization', () => {
    it('should not re-render when unrelated props change', () => {
      const { rerender } = render(<VoucherCard voucher={mockVoucher} />)

      const article = screen.getByRole('article')
      const firstRender = article.innerHTML

      rerender(<VoucherCard voucher={mockVoucher} />)

      expect(article.innerHTML).toBe(firstRender)
    })
  })

  describe('Edge Cases', () => {
    it('should handle voucher without max_discount', () => {
      const voucherNoMax = { ...mockVoucher, max_discount: undefined }

      render(<VoucherCard voucher={voucherNoMax} />)

      expect(screen.queryByText(/Max/)).not.toBeInTheDocument()
    })

    it('should handle voucher with zero min_order_value', () => {
      const voucherNoMin = { ...mockVoucher, min_order_value: 0 }

      render(<VoucherCard voucher={voucherNoMin} />)

      expect(screen.getByText('Min order $0')).toBeInTheDocument()
    })

    it('should handle very long voucher names', () => {
      const longNameVoucher = {
        ...mockVoucher,
        name: 'This is a very long voucher name that should be truncated',
      }

      render(<VoucherCard voucher={longNameVoucher} />)

      const nameElement = screen.getByText(longNameVoucher.name)
      expect(nameElement).toHaveClass('line-clamp-1')
    })

    it('should handle very long descriptions', () => {
      const longDescVoucher = {
        ...mockVoucher,
        description: 'This is a very long description that should be truncated to one line',
      }

      render(<VoucherCard voucher={longDescVoucher} />)

      const descElement = screen.getByText(longDescVoucher.description)
      expect(descElement).toHaveClass('line-clamp-1')
    })
  })
})
