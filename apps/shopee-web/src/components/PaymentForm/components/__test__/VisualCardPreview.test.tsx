import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { VisualCardPreview, CVVTooltip } from '../VisualCardPreview'

describe('VisualCardPreview', () => {
  const defaultProps = {
    cardNumber: '4111 1111 1111 1111',
    cardHolder: 'NGUYEN VAN A',
    expiryDate: '12/25',
    cardType: 'visa' as const,
    cvv: '123',
    isFlipped: false,
  }

  it('renders card number', () => {
    render(<VisualCardPreview {...defaultProps} />)
    expect(screen.getByText('4111 1111 1111 1111')).toBeInTheDocument()
  })

  it('renders card holder', () => {
    render(<VisualCardPreview {...defaultProps} />)
    expect(screen.getByText('NGUYEN VAN A')).toBeInTheDocument()
  })

  it('renders expiry date', () => {
    render(<VisualCardPreview {...defaultProps} />)
    expect(screen.getByText('12/25')).toBeInTheDocument()
  })

  it('renders placeholder when no card number', () => {
    render(<VisualCardPreview {...defaultProps} cardNumber="" />)
    expect(screen.getByText('•••• •••• •••• ••••')).toBeInTheDocument()
  })

  it('renders placeholder when no card holder', () => {
    render(<VisualCardPreview {...defaultProps} cardHolder="" />)
    expect(screen.getByText('CARDHOLDER NAME')).toBeInTheDocument()
  })

  it('renders placeholder when no expiry', () => {
    render(<VisualCardPreview {...defaultProps} expiryDate="" />)
    expect(screen.getByText('MM/YY')).toBeInTheDocument()
  })

  it('renders CVV on back', () => {
    render(<VisualCardPreview {...defaultProps} isFlipped={true} />)
    expect(screen.getByText('123')).toBeInTheDocument()
  })

  it('renders with mastercard type', () => {
    const { container } = render(<VisualCardPreview {...defaultProps} cardType="mastercard" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with amex type', () => {
    render(<VisualCardPreview {...defaultProps} cardType="amex" cvv="1234" />)
    expect(screen.getByText('1234')).toBeInTheDocument()
  })

  it('pads CVV for amex (4 digits)', () => {
    render(<VisualCardPreview {...defaultProps} cardType="amex" cvv="12" isFlipped={true} />)
    expect(screen.getByText('12••')).toBeInTheDocument()
  })

  it('pads CVV for non-amex (3 digits)', () => {
    render(<VisualCardPreview {...defaultProps} cvv="1" isFlipped={true} />)
    expect(screen.getByText('1••')).toBeInTheDocument()
  })

  it('renders with jcb card type', () => {
    render(<VisualCardPreview {...defaultProps} cardType="jcb" />)
    expect(screen.getByText('4111 1111 1111 1111')).toBeInTheDocument()
  })

  it('renders with unknown card type', () => {
    render(<VisualCardPreview {...defaultProps} cardType="unknown" />)
    expect(screen.getByText('4111 1111 1111 1111')).toBeInTheDocument()
  })

  it('applies correct gradient for visa', () => {
    const { container } = render(<VisualCardPreview {...defaultProps} cardType="visa" />)
    const card = container.querySelector('.from-blue-600')
    expect(card).toBeInTheDocument()
  })

  it('applies correct gradient for mastercard', () => {
    const { container } = render(<VisualCardPreview {...defaultProps} cardType="mastercard" />)
    const card = container.querySelector('.from-red-500')
    expect(card).toBeInTheDocument()
  })

  it('applies correct gradient for jcb', () => {
    const { container } = render(<VisualCardPreview {...defaultProps} cardType="jcb" />)
    const card = container.querySelector('.from-green-500')
    expect(card).toBeInTheDocument()
  })

  it('applies correct gradient for amex', () => {
    const { container } = render(<VisualCardPreview {...defaultProps} cardType="amex" />)
    const card = container.querySelector('.from-blue-400')
    expect(card).toBeInTheDocument()
  })

  it('applies correct gradient for unknown', () => {
    const { container } = render(<VisualCardPreview {...defaultProps} cardType="unknown" />)
    const card = container.querySelector('.from-gray-600')
    expect(card).toBeInTheDocument()
  })

  it('shows front when not flipped', () => {
    render(<VisualCardPreview {...defaultProps} isFlipped={false} />)
    expect(screen.getByText('NGUYEN VAN A')).toBeInTheDocument()
  })

  it('shows CVV placeholder when empty for visa', () => {
    render(<VisualCardPreview {...defaultProps} cvv="" isFlipped={true} />)
    expect(screen.getByText('•••')).toBeInTheDocument()
  })

  it('shows CVV placeholder when empty for amex', () => {
    render(<VisualCardPreview {...defaultProps} cardType="amex" cvv="" isFlipped={true} />)
    expect(screen.getByText('••••')).toBeInTheDocument()
  })

  it('renders card holder label', () => {
    render(<VisualCardPreview {...defaultProps} />)
    expect(screen.getByText('Card Holder')).toBeInTheDocument()
  })

  it('renders expires label', () => {
    render(<VisualCardPreview {...defaultProps} />)
    expect(screen.getByText('Expires')).toBeInTheDocument()
  })

  it('renders CVV label when flipped', () => {
    render(<VisualCardPreview {...defaultProps} isFlipped={true} />)
    expect(screen.getByText('CVV/CVC')).toBeInTheDocument()
  })

  it('handles partial card number', () => {
    render(<VisualCardPreview {...defaultProps} cardNumber="4111" />)
    expect(screen.getByText('4111')).toBeInTheDocument()
  })

  it('handles partial card holder', () => {
    render(<VisualCardPreview {...defaultProps} cardHolder="NGUYEN" />)
    expect(screen.getByText('NGUYEN')).toBeInTheDocument()
  })

  it('handles partial expiry date', () => {
    render(<VisualCardPreview {...defaultProps} expiryDate="12" />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('pads CVV correctly for full amex CVV', () => {
    render(<VisualCardPreview {...defaultProps} cardType="amex" cvv="1234" isFlipped={true} />)
    expect(screen.getByText('1234')).toBeInTheDocument()
  })

  it('pads CVV correctly for full visa CVV', () => {
    render(<VisualCardPreview {...defaultProps} cardType="visa" cvv="123" isFlipped={true} />)
    expect(screen.getByText('123')).toBeInTheDocument()
  })

  it('pads CVV correctly for single digit', () => {
    render(<VisualCardPreview {...defaultProps} cvv="5" isFlipped={true} />)
    expect(screen.getByText('5••')).toBeInTheDocument()
  })

  it('pads CVV correctly for two digits', () => {
    render(<VisualCardPreview {...defaultProps} cvv="56" isFlipped={true} />)
    expect(screen.getByText('56•')).toBeInTheDocument()
  })

  it('pads amex CVV correctly for single digit', () => {
    render(<VisualCardPreview {...defaultProps} cardType="amex" cvv="5" isFlipped={true} />)
    expect(screen.getByText('5•••')).toBeInTheDocument()
  })

  it('pads amex CVV correctly for two digits', () => {
    render(<VisualCardPreview {...defaultProps} cardType="amex" cvv="56" isFlipped={true} />)
    expect(screen.getByText('56••')).toBeInTheDocument()
  })

  it('pads amex CVV correctly for three digits', () => {
    render(<VisualCardPreview {...defaultProps} cardType="amex" cvv="567" isFlipped={true} />)
    expect(screen.getByText('567•')).toBeInTheDocument()
  })
})

describe('CVVTooltip', () => {
  it('renders when visible', () => {
    render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="visa" />)
    expect(screen.getByText('CVV là gì?')).toBeInTheDocument()
  })

  it('does not render when not visible', () => {
    render(<CVVTooltip isVisible={false} onClose={vi.fn()} cardType="visa" />)
    expect(screen.queryByText('CVV là gì?')).not.toBeInTheDocument()
  })

  it('shows 3 digits for non-amex', () => {
    render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="visa" />)
    expect(screen.getByText(/3 số/)).toBeInTheDocument()
    expect(screen.getByText(/mặt sau thẻ/)).toBeInTheDocument()
  })

  it('shows 4 digits for amex', () => {
    render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="amex" />)
    expect(screen.getByText(/4 số/)).toBeInTheDocument()
    expect(screen.getByText(/mặt trước thẻ/)).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<CVVTooltip isVisible={true} onClose={onClose} cardType="visa" />)
    await user.click(screen.getByLabelText('Đóng tooltip'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows 3 digits for mastercard', () => {
    render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="mastercard" />)
    expect(screen.getByText(/3 số/)).toBeInTheDocument()
    expect(screen.getByText(/mặt sau thẻ/)).toBeInTheDocument()
  })

  it('shows 3 digits for jcb', () => {
    render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="jcb" />)
    expect(screen.getByText(/3 số/)).toBeInTheDocument()
    expect(screen.getByText(/mặt sau thẻ/)).toBeInTheDocument()
  })

  it('shows 3 digits for unknown', () => {
    render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="unknown" />)
    expect(screen.getByText(/3 số/)).toBeInTheDocument()
    expect(screen.getByText(/mặt sau thẻ/)).toBeInTheDocument()
  })

  it('renders CVV description text', () => {
    render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="visa" />)
    expect(screen.getByText(/Mã bảo mật/)).toBeInTheDocument()
  })

  it('renders card visualization for non-amex', () => {
    const { container } = render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="visa" />)
    const visualization = container.querySelector('.from-gray-600')
    expect(visualization).toBeInTheDocument()
  })

  it('renders card visualization for amex', () => {
    const { container } = render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="amex" />)
    const visualization = container.querySelector('.from-gray-600')
    expect(visualization).toBeInTheDocument()
  })

  it('shows different layout for amex visualization', () => {
    const { container } = render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="amex" />)
    const badge = container.querySelector('.bg-yellow-400')
    expect(badge).toBeInTheDocument()
  })

  it('shows different layout for non-amex visualization', () => {
    const { container } = render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="visa" />)
    const stripe = container.querySelector('.bg-gray-900')
    expect(stripe).toBeInTheDocument()
  })

  it('close button has correct aria-label', () => {
    render(<CVVTooltip isVisible={true} onClose={vi.fn()} cardType="visa" />)
    expect(screen.getByLabelText('Đóng tooltip')).toBeInTheDocument()
  })

  it('does not call onClose when not clicked', () => {
    const onClose = vi.fn()
    render(<CVVTooltip isVisible={true} onClose={onClose} cardType="visa" />)
    expect(onClose).not.toHaveBeenCalled()
  })
})
