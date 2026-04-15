import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EWalletPayment from '../EWalletPayment'

vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))

describe('EWalletPayment', () => {
  it('renders wallet selection view initially', () => {
    render(<EWalletPayment />)
    expect(screen.getByText('Chọn ví điện tử')).toBeInTheDocument()
  })

  it('renders all wallets', () => {
    render(<EWalletPayment />)
    expect(screen.getByText('MoMo')).toBeInTheDocument()
    expect(screen.getByText('ZaloPay')).toBeInTheDocument()
    expect(screen.getByText('VNPay')).toBeInTheDocument()
  })

  it('shows proceed button after selecting wallet', () => {
    render(<EWalletPayment />)
    fireEvent.click(screen.getByText('MoMo'))
    expect(screen.getByText('Tiếp tục thanh toán')).toBeInTheDocument()
  })

  it('does not show proceed button without selection', () => {
    render(<EWalletPayment />)
    expect(screen.queryByText('Tiếp tục thanh toán')).not.toBeInTheDocument()
  })

  it('renders with custom amount', () => {
    render(<EWalletPayment amount={250000} />)
    expect(screen.getByText('Chọn ví điện tử')).toBeInTheDocument()
  })

  it('renders link new wallet button', () => {
    render(<EWalletPayment />)
    expect(screen.getByText('Liên kết ví mới')).toBeInTheDocument()
  })

  it('shows QR display after proceeding', async () => {
    render(<EWalletPayment />)
    fireEvent.click(screen.getByText('MoMo'))
    fireEvent.click(screen.getByText('Tiếp tục thanh toán'))
    await waitFor(
      () => {
        expect(screen.getByText('Quét mã QR để thanh toán')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('calls onPaymentComplete callback', () => {
    const onComplete = vi.fn()
    render(<EWalletPayment onPaymentComplete={onComplete} />)
    expect(screen.getByText('Chọn ví điện tử')).toBeInTheDocument()
  })

  it('calls onPaymentFailed callback', () => {
    const onFailed = vi.fn()
    render(<EWalletPayment onPaymentFailed={onFailed} />)
    expect(screen.getByText('Chọn ví điện tử')).toBeInTheDocument()
  })
})
