import { describe, it, expect} from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  CheckoutProgressStepper,
  CHECKOUT_STEPS,
} from '../../Checkout/components/CheckoutProgressStepper'

describe('CheckoutProgressStepper', () => {
  it('CHECKOUT_STEPS has 4 items', () => {
    expect(CHECKOUT_STEPS).toHaveLength(4)
    expect(CHECKOUT_STEPS.map((s) => s.name)).toEqual(['address', 'shipping', 'payment', 'confirm'])
  })

  it('renders all 4 step labels', () => {
    render(<CheckoutProgressStepper currentStep={1} />)
    expect(screen.getByText('Địa chỉ')).toBeInTheDocument()
    expect(screen.getByText('Vận chuyển')).toBeInTheDocument()
    expect(screen.getByText('Thanh toán')).toBeInTheDocument()
    expect(screen.getByText('Xác nhận')).toBeInTheDocument()
  })

  it('shows step numbers for future steps', () => {
    render(<CheckoutProgressStepper currentStep={1} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('shows checkmark for completed steps', () => {
    const { container } = render(<CheckoutProgressStepper currentStep={3} />)
    const checkmarks = container.querySelectorAll('path[d="M5 13l4 4L19 7"]')
    expect(checkmarks.length).toBe(2)
  })

  it('renders connector lines between steps', () => {
    const { container } = render(<CheckoutProgressStepper currentStep={2} />)
    const connectors = container.querySelectorAll('.bg-gray-200')
    expect(connectors.length).toBe(3)
  })
})
