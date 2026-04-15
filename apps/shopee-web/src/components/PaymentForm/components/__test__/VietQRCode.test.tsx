import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VietQRCode from '../VietQRCode'

const mockBank = {
  id: 'vcb' as const,
  name: 'Vietcombank',
  shortName: 'VCB',
  color: 'text-green-600',
  bgColor: 'bg-green-50',
  accountNumber: '1234567890',
  accountHolder: 'NGUYEN VAN A',
  branch: 'HCM',
}

describe('VietQRCode', () => {
  it('renders QR scan instruction', () => {
    render(<VietQRCode bank={mockBank} amount={500000} transferContent="SHOPEE123" />)
    expect(screen.getByText('Quét mã VietQR để thanh toán')).toBeInTheDocument()
  })

  it('renders bank short name in logo', () => {
    render(<VietQRCode bank={mockBank} amount={500000} transferContent="SHOPEE123" />)
    expect(screen.getByText('VCB')).toBeInTheDocument()
  })

  it('renders amount in description', () => {
    render(<VietQRCode bank={mockBank} amount={500000} transferContent="SHOPEE123" />)
    expect(screen.getByText(/Mã QR đã bao gồm số tiền/)).toBeInTheDocument()
  })

  it('renders SVG QR code', () => {
    const { container } = render(
      <VietQRCode bank={mockBank} amount={500000} transferContent="SHOPEE123" />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with different bank', () => {
    const tcbBank = { ...mockBank, id: 'tcb' as const, name: 'Techcombank', shortName: 'TCB' }
    render(<VietQRCode bank={tcbBank} amount={100000} transferContent="ORDER456" />)
    expect(screen.getByText('TCB')).toBeInTheDocument()
  })
})
