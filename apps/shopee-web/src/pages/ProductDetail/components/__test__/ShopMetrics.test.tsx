import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ShopMetrics from '../ShopMetrics'

describe('ShopMetrics', () => {
  it('renders shop statistics section', () => {
    render(<ShopMetrics rating={4.5} />)
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  it('renders rating with one decimal place', () => {
    render(<ShopMetrics rating={4.5} />)
    expect(screen.getByText('4.5/5.0')).toBeInTheDocument()
  })

  it('renders response rate metric', () => {
    render(<ShopMetrics rating={4.2} />)
    expect(screen.getByText('95%')).toBeInTheDocument()
  })

  it('renders product count metric', () => {
    render(<ShopMetrics rating={4.2} />)
    expect(screen.getByText('128')).toBeInTheDocument()
  })

  it('renders follower count metric', () => {
    render(<ShopMetrics rating={4.2} />)
    expect(screen.getByText('12.5k')).toBeInTheDocument()
  })

  it('renders all label keys', () => {
    render(<ShopMetrics rating={4.0} />)
    expect(screen.getByText(/Đánh Giá:/)).toBeInTheDocument()
    expect(screen.getByText(/Tỉ Lệ Phản Hồi:/)).toBeInTheDocument()
    expect(screen.getByText(/Sản Phẩm:/)).toBeInTheDocument()
    expect(screen.getByText(/Thời Gian Phản Hồi:/)).toBeInTheDocument()
    expect(screen.getByText(/Tham Gia:/)).toBeInTheDocument()
    expect(screen.getByText(/Người Theo Dõi:/)).toBeInTheDocument()
  })

  it('renders joined years metric', () => {
    render(<ShopMetrics rating={4.0} />)
    expect(screen.getByText(/năm/)).toBeInTheDocument()
  })

  it('renders response time metric', () => {
    render(<ShopMetrics rating={4.0} />)
    expect(screen.getByText('trong vài giờ')).toBeInTheDocument()
  })

  it('renders with different rating values', () => {
    const { rerender } = render(<ShopMetrics rating={3.0} />)
    expect(screen.getByText('3.0/5.0')).toBeInTheDocument()

    rerender(<ShopMetrics rating={5.0} />)
    expect(screen.getByText('5.0/5.0')).toBeInTheDocument()
  })

  it('renders grid with 2 columns', () => {
    const { container } = render(<ShopMetrics rating={4.5} />)
    const grid = container.querySelector('.grid.grid-cols-2')
    expect(grid).toBeInTheDocument()
  })

  it('renders exactly 6 metric rows', () => {
    const { container } = render(<ShopMetrics rating={4.5} />)
    const rows = container.querySelectorAll('.flex.items-center.gap-2.text-sm')
    expect(rows.length).toBe(6)
  })
})
