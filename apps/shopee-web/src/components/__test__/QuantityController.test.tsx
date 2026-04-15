import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuantityController from '../QuantityController/QuantityController'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, animated, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/components/InputNumber', () => ({
  default: ({ onChange, onBlur, value, classNameInput, classNameError, ...props }: any) => (
    <input onChange={onChange} onBlur={onBlur} value={value} {...props} />
  ),
}))

vi.mock('../DeleteModal', () => ({
  default: ({ open, handleIsAgree, handleIsCancel, product }: any) =>
    open ? (
      <div data-testid="delete-modal">
        <button onClick={handleIsAgree}>Confirm Delete</button>
        <button onClick={handleIsCancel}>Cancel Delete</button>
      </div>
    ) : null,
}))

describe('QuantityController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('renders increase and decrease buttons', () => {
    render(<QuantityController value={1} />)
    expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument()
    expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument()
  })

  it('renders input with value', () => {
    render(<QuantityController value={5} />)
    expect(screen.getByLabelText('Quantity')).toHaveValue('5')
  })

  it('calls onIncrease when increase button clicked', () => {
    const onIncrease = vi.fn()
    render(<QuantityController value={3} onIncrease={onIncrease} />)
    fireEvent.click(screen.getByLabelText('Increase quantity'))
    expect(onIncrease).toHaveBeenCalledWith(4)
  })

  it('calls onDecrease when decrease button clicked', () => {
    const onDecrease = vi.fn()
    render(<QuantityController value={3} onDecrease={onDecrease} />)
    fireEvent.click(screen.getByLabelText('Decrease quantity'))
    expect(onDecrease).toHaveBeenCalledWith(2)
  })

  it('does not exceed max on increase', () => {
    const onIncrease = vi.fn()
    render(<QuantityController value={5} max={5} onIncrease={onIncrease} />)
    fireEvent.click(screen.getByLabelText('Increase quantity'))
    expect(onIncrease).toHaveBeenCalledWith(5)
  })

  it('does not go below 1 on decrease', () => {
    const onDecrease = vi.fn()
    render(<QuantityController value={1} onDecrease={onDecrease} />)
    fireEvent.click(screen.getByLabelText('Decrease quantity'))
    expect(onDecrease).toHaveBeenCalledWith(1)
  })

  it('calls onType when input changes', () => {
    const onType = vi.fn()
    render(<QuantityController value={1} onType={onType} />)
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } })
    expect(onType).toHaveBeenCalledWith(5)
  })

  it('clamps input value to max', () => {
    const onType = vi.fn()
    render(<QuantityController value={1} max={10} onType={onType} />)
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '15' } })
    expect(onType).toHaveBeenCalledWith(10)
  })

  it('clamps input value to minimum 1', () => {
    const onType = vi.fn()
    render(<QuantityController value={1} onType={onType} />)
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '0' } })
    expect(onType).toHaveBeenCalledWith(1)
  })

  it('calls onFocusOut on blur', () => {
    const onFocusOut = vi.fn()
    render(<QuantityController value={3} onFocusOut={onFocusOut} />)
    fireEvent.blur(screen.getByLabelText('Quantity'), { target: { value: '3' } })
    expect(onFocusOut).toHaveBeenCalledWith(3)
  })

  it('shows delete modal when decreasing from 1 in cart mode', () => {
    const product = { _id: '123', name: 'Test' } as any
    render(<QuantityController value={1} isQuantityInCart={true} product={product} />)
    fireEvent.click(screen.getByLabelText('Decrease quantity'))
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument()
  })

  it('does not show delete modal when not in cart mode', () => {
    render(<QuantityController value={1} />)
    fireEvent.click(screen.getByLabelText('Decrease quantity'))
    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
  })

  it('calls handleDelete when confirm delete clicked', () => {
    const handleDelete = vi.fn()
    const product = { _id: '123', name: 'Test' } as any
    render(
      <QuantityController
        value={1}
        isQuantityInCart={true}
        product={product}
        handleDelete={handleDelete}
      />,
    )
    fireEvent.click(screen.getByLabelText('Decrease quantity'))
    fireEvent.click(screen.getByText('Confirm Delete'))
    expect(handleDelete).toHaveBeenCalledWith(123)
  })

  it('hides delete modal when cancel clicked', () => {
    const product = { _id: '123', name: 'Test' } as any
    render(<QuantityController value={1} isQuantityInCart={true} product={product} />)
    fireEvent.click(screen.getByLabelText('Decrease quantity'))
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel Delete'))
    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
  })

  it('applies custom classNameWrapper', () => {
    const { container } = render(<QuantityController value={1} classNameWrapper="custom-wrapper" />)
    expect(container.querySelector('.custom-wrapper')).toBeInTheDocument()
  })

  it('sets aria attributes on input', () => {
    render(<QuantityController value={3} max={10} />)
    const input = screen.getByLabelText('Quantity')
    expect(input).toHaveAttribute('aria-valuemin', '1')
    expect(input).toHaveAttribute('aria-valuemax', '10')
    expect(input).toHaveAttribute('aria-valuenow', '3')
  })
})
