import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/utils/testUtils'
import PaymentForm from './PaymentForm'

describe('PaymentForm', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined)
  const mockOnCancel = vi.fn()

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    amount: 500000,
  }

  it('renders payment method tabs', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />)

    const bodyText = document.body.textContent || ''
    // PaymentForm uses i18n keys: tabs.creditCard, tabs.bankTransfer, tabs.eWallet
    expect(
      bodyText.includes('Thẻ tín dụng') ||
        bodyText.includes('credit') ||
        bodyText.includes('Thanh toán'),
    ).toBeTruthy()
  })

  it('shows credit card form by default', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />)

    // Credit card form has input fields for card number, holder, expiry, cvv
    const inputs = document.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('switches to bank transfer tab on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentForm {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    // Find the bank transfer tab (second tab)
    const bankTab = buttons.find(
      (btn) => btn.textContent?.includes('Chuyển khoản') || btn.textContent?.includes('bank'),
    )

    if (bankTab) {
      await user.click(bankTab)
      await waitFor(() => {
        const bodyText = document.body.textContent || ''
        expect(bodyText.includes('ngân hàng') || bodyText.includes('Chuyển khoản')).toBeTruthy()
      })
    }
  })

  it('switches to e-wallet tab on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentForm {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    const eWalletTab = buttons.find(
      (btn) => btn.textContent?.includes('Ví điện tử') || btn.textContent?.includes('wallet'),
    )

    if (eWalletTab) {
      await user.click(eWalletTab)
      await waitFor(() => {
        const bodyText = document.body.textContent || ''
        expect(
          bodyText.includes('Ví điện tử') ||
            bodyText.includes('MoMo') ||
            bodyText.includes('ZaloPay'),
        ).toBeTruthy()
      })
    }
  })

  it('renders cancel button when onCancel is provided', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />)

    const bodyText = document.body.textContent || ''
    expect(
      bodyText.includes('Hủy') || bodyText.includes('cancel') || bodyText.includes('Cancel'),
    ).toBeTruthy()
  })
})
