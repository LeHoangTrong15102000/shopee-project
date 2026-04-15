import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AccountInfoCard from '../AccountInfoCard'

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

describe('AccountInfoCard', () => {
  it('renders bank name', () => {
    render(<AccountInfoCard bank={mockBank} amount={500000} transferContent="SHOPEE123" />)
    expect(screen.getByText('Vietcombank')).toBeInTheDocument()
  })

  it('renders account number', () => {
    render(<AccountInfoCard bank={mockBank} amount={500000} transferContent="SHOPEE123" />)
    expect(screen.getByText('1234567890')).toBeInTheDocument()
  })

  it('renders account holder', () => {
    render(<AccountInfoCard bank={mockBank} amount={500000} transferContent="SHOPEE123" />)
    expect(screen.getByText('NGUYEN VAN A')).toBeInTheDocument()
  })

  it('renders transfer content', () => {
    render(<AccountInfoCard bank={mockBank} amount={500000} transferContent="SHOPEE123" />)
    expect(screen.getByText('SHOPEE123')).toBeInTheDocument()
  })

  it('renders section title', () => {
    render(<AccountInfoCard bank={mockBank} amount={500000} transferContent="SHOPEE123" />)
    expect(screen.getByText('Thông tin chuyển khoản')).toBeInTheDocument()
  })

  it('renders labels', () => {
    render(<AccountInfoCard bank={mockBank} amount={500000} transferContent="SHOPEE123" />)
    expect(screen.getByText('Ngân hàng')).toBeInTheDocument()
    expect(screen.getByText('Số tài khoản')).toBeInTheDocument()
    expect(screen.getByText('Chủ tài khoản')).toBeInTheDocument()
    expect(screen.getByText('Số tiền')).toBeInTheDocument()
    expect(screen.getByText('Nội dung chuyển khoản')).toBeInTheDocument()
  })

  it('renders warning note', () => {
    render(<AccountInfoCard bank={mockBank} amount={500000} transferContent="SHOPEE123" />)
    expect(screen.getByText(/Vui lòng nhập chính xác nội dung chuyển khoản/)).toBeInTheDocument()
  })
})
