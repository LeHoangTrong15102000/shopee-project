import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrderTimeline from './OrderTimeline'
import { purchasesStatus } from 'src/constant/purchase'

describe('OrderTimeline', () => {
  it('renders all order steps', () => {
    render(<OrderTimeline orderId='test-order' currentStatus={purchasesStatus.waitForConfirmation} />)
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument()
    expect(screen.getByText('Chờ lấy hàng')).toBeInTheDocument()
    expect(screen.getByText('Đang giao')).toBeInTheDocument()
    expect(screen.getByText('Đã giao')).toBeInTheDocument()
  })

  it('renders cancelled state correctly', () => {
    render(<OrderTimeline orderId='test-order' currentStatus={purchasesStatus.cancelled} />)
    expect(screen.getByText('Đơn hàng đã hủy')).toBeInTheDocument()
  })

  it('renders progress bar', () => {
    render(<OrderTimeline orderId='test-order' currentStatus={purchasesStatus.inProgress} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
