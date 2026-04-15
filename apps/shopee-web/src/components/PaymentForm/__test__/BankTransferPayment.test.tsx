import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BankTransferPayment from '../BankTransferPayment'

describe('BankTransferPayment', () => {
  it('renders bank selection view initially', () => {
    render(<BankTransferPayment />)
    expect(screen.getByText('Chọn ngân hàng...')).toBeInTheDocument()
  })

  it('renders bank transfer title', () => {
    render(<BankTransferPayment />)
    expect(screen.getAllByText(/Chuyển khoản ngân hàng/).length).toBeGreaterThan(0)
  })

  it('shows continue button after selecting bank', () => {
    render(<BankTransferPayment />)
    // Open dropdown
    fireEvent.click(screen.getByText('Chọn ngân hàng...'))
    // Select a bank
    fireEvent.click(screen.getByText('Vietcombank'))
    expect(screen.getAllByText(/Tiếp tục/).length).toBeGreaterThan(0)
  })

  it('renders with custom amount', () => {
    render(<BankTransferPayment amount={1000000} />)
    expect(screen.getByText('Chọn ngân hàng...')).toBeInTheDocument()
  })

  it('renders with custom orderId', () => {
    render(<BankTransferPayment orderId="TEST123" />)
    expect(screen.getByText('Chọn ngân hàng...')).toBeInTheDocument()
  })
})
