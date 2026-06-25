import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js'
import { StripeCardForm } from '../StripeCardForm'

// Extended CardElement mock:
// - The <input data-testid="card-input"> fires change events with only an error field
//   (preserving the original test contract for onError tests).
// - The <button data-testid="card-complete-true"> fires a complete:true change event.
// - The <button data-testid="card-complete-false"> fires a complete:false change event.
vi.mock('@stripe/react-stripe-js', () => ({
  CardElement: ({
    onChange,
    options,
  }: {
    onChange?: (event: StripeCardElementChangeEvent) => void
    options?: { disabled?: boolean }
  }) => (
    <div data-testid="card-element" data-disabled={options?.disabled}>
      <input
        data-testid="card-input"
        onChange={(e) =>
          onChange?.({
            complete: false,
            error: e.target.value
              ? { message: e.target.value, type: 'validation_error', code: 'invalid_number' }
              : undefined,
            elementType: 'card',
            empty: !e.target.value,
            value: { postalCode: '' },
            brand: 'unknown',
          } as StripeCardElementChangeEvent)
        }
      />
      <button
        data-testid="card-complete-true"
        onClick={() =>
          onChange?.({
            complete: true,
            error: undefined,
            elementType: 'card',
            empty: false,
            value: { postalCode: '' },
            brand: 'visa',
          } as StripeCardElementChangeEvent)
        }
      >
        simulate complete
      </button>
      <button
        data-testid="card-complete-false"
        onClick={() =>
          onChange?.({
            complete: false,
            error: undefined,
            elementType: 'card',
            empty: false,
            value: { postalCode: '' },
            brand: 'visa',
          } as StripeCardElementChangeEvent)
        }
      >
        simulate incomplete
      </button>
    </div>
  ),
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements">{children}</div>
  ),
  useStripe: vi.fn(),
  useElements: vi.fn(),
}))

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({})),
}))

describe('StripeCardForm', () => {
  it('renders the CardElement', () => {
    render(<StripeCardForm />)
    expect(screen.getByTestId('card-element')).toBeInTheDocument()
  })

  it('has aria-label on the card container', () => {
    render(<StripeCardForm />)
    const container = screen.getByLabelText('Card details')
    expect(container).toBeInTheDocument()
  })

  it('does not show error message initially', () => {
    render(<StripeCardForm />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows validation error when card change event has an error', () => {
    render(<StripeCardForm />)
    const input = screen.getByTestId('card-input')
    fireEvent.change(input, { target: { value: 'Your card number is invalid.' } })
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert.textContent).toBe('Your card number is invalid.')
  })

  it('clears error when card change event has no error', () => {
    render(<StripeCardForm />)
    const input = screen.getByTestId('card-input')

    // Trigger an error first
    fireEvent.change(input, { target: { value: 'Invalid card' } })
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Clear the error by sending empty value
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('calls onError callback with error message when error occurs', () => {
    const onError = vi.fn()
    render(<StripeCardForm onError={onError} />)
    const input = screen.getByTestId('card-input')
    fireEvent.change(input, { target: { value: 'Card declined.' } })
    expect(onError).toHaveBeenCalledWith('Card declined.')
  })

  it('calls onError callback with null when error is cleared', () => {
    const onError = vi.fn()
    render(<StripeCardForm onError={onError} />)
    const input = screen.getByTestId('card-input')

    fireEvent.change(input, { target: { value: 'Some error' } })
    fireEvent.change(input, { target: { value: '' } })

    expect(onError).toHaveBeenLastCalledWith(null)
  })

  it('passes disabled=true to CardElement options when disabled prop is true', () => {
    render(<StripeCardForm disabled={true} />)
    const cardElement = screen.getByTestId('card-element')
    expect(cardElement.getAttribute('data-disabled')).toBe('true')
  })

  it('passes disabled=false to CardElement options by default', () => {
    render(<StripeCardForm />)
    const cardElement = screen.getByTestId('card-element')
    expect(cardElement.getAttribute('data-disabled')).toBe('false')
  })

  it('error paragraph has role="alert"', () => {
    render(<StripeCardForm />)
    const input = screen.getByTestId('card-input')
    fireEvent.change(input, { target: { value: 'Expired card.' } })
    const alert = screen.getByRole('alert')
    expect(alert.tagName.toLowerCase()).toBe('p')
  })

  // onValidityChange tests
  it('calls onValidityChange with true when CardElement fires complete:true', () => {
    const onValidityChange = vi.fn()
    render(<StripeCardForm onValidityChange={onValidityChange} />)
    fireEvent.click(screen.getByTestId('card-complete-true'))
    expect(onValidityChange).toHaveBeenCalledTimes(1)
    expect(onValidityChange).toHaveBeenCalledWith(true)
  })

  it('calls onValidityChange with false when CardElement fires complete:false', () => {
    const onValidityChange = vi.fn()
    render(<StripeCardForm onValidityChange={onValidityChange} />)
    fireEvent.click(screen.getByTestId('card-complete-false'))
    expect(onValidityChange).toHaveBeenCalledTimes(1)
    expect(onValidityChange).toHaveBeenCalledWith(false)
  })

  it('does not throw when onValidityChange is not provided and a change event fires', () => {
    expect(() => {
      render(<StripeCardForm />)
      fireEvent.click(screen.getByTestId('card-complete-true'))
    }).not.toThrow()
  })
})
