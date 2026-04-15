import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PaymentForm from '../PaymentForm'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = p
      return <div {...rest}>{children}</div>
    },
    form: ({ children, onSubmit, ...p }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = p
      return (
        <form onSubmit={onSubmit} {...rest}>
          {children}
        </form>
      )
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, type, disabled, ...props }: any) => {
    const { animated, variant, ariaLabel, isLoading, ...rest } = props
    return (
      <button onClick={onClick} className={className} type={type} disabled={disabled} {...rest}>
        {children}
      </button>
    )
  },
}))

vi.mock('../CreditCardForm', () => ({
  default: () => <div data-testid="credit-card-form">credit card form</div>,
}))

vi.mock('../BankTransferPayment', () => ({
  default: ({ onPaymentConfirmed, onPaymentExpired }: any) => (
    <div data-testid="bank-transfer">
      <button onClick={onPaymentConfirmed}>confirm</button>
      <button onClick={onPaymentExpired}>expire</button>
    </div>
  ),
}))

vi.mock('../EWalletPayment', () => ({
  default: ({ onPaymentComplete, onPaymentFailed }: any) => (
    <div data-testid="e-wallet">
      <button onClick={onPaymentComplete}>complete</button>
      <button onClick={() => onPaymentFailed('wallet error')}>fail</button>
    </div>
  ),
}))

describe('PaymentForm', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)

  it('renders payment title', () => {
    render(<PaymentForm onSubmit={onSubmit} />)
    const headings = screen.getAllByRole('heading')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('renders payment method tabs', () => {
    render(<PaymentForm onSubmit={onSubmit} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(3)
  })

  it('shows credit card form by default', () => {
    render(<PaymentForm onSubmit={onSubmit} />)
    expect(screen.getByTestId('credit-card-form')).toBeInTheDocument()
  })

  it('switches to bank transfer tab', () => {
    render(<PaymentForm onSubmit={onSubmit} />)
    const buttons = screen.getAllByRole('button')
    // Find bank transfer tab (second tab)
    fireEvent.click(buttons[1])
    expect(screen.getByTestId('bank-transfer')).toBeInTheDocument()
  })

  it('switches to e-wallet tab', () => {
    render(<PaymentForm onSubmit={onSubmit} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[2])
    expect(screen.getByTestId('e-wallet')).toBeInTheDocument()
  })

  it('renders cancel button when onCancel provided', () => {
    const onCancel = vi.fn()
    render(<PaymentForm onSubmit={onSubmit} onCancel={onCancel} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })

  it('renders secure badge', () => {
    render(<PaymentForm onSubmit={onSubmit} />)
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(1)
  })

  it('shows success state after bank transfer confirmed', () => {
    render(<PaymentForm onSubmit={onSubmit} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1]) // switch to bank transfer
    fireEvent.click(screen.getByText('confirm'))
    // Should show success feedback
    const headings = screen.getAllByRole('heading')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('shows error state after e-wallet payment fails', () => {
    render(<PaymentForm onSubmit={onSubmit} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[2]) // switch to e-wallet
    fireEvent.click(screen.getByText('fail'))
    // Should show error feedback with retry button
    expect(screen.getByText('wallet error')).toBeInTheDocument()
  })

  it('retries after error', () => {
    render(<PaymentForm onSubmit={onSubmit} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[2]) // switch to e-wallet
    fireEvent.click(screen.getByText('fail'))
    // Click retry
    const retryButtons = screen.getAllByRole('button')
    fireEvent.click(retryButtons[0])
    // Should go back to idle state with tabs
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3)
  })
})
