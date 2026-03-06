import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import OrderCard from './OrderCard'
import type { Order } from 'src/types/checkout.type'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

const mockOrder: Order = {
  _id: 'order123456789',
  userId: 'user1',
  items: [
    {
      product: {
        _id: 'p1',
        name: 'Test Product',
        image: 'test.jpg',
        images: ['test.jpg'],
        price: 100000,
        price_before_discount: 120000,
        rating: 4.5,
        quantity: 100,
        sold: 50,
        view: 1000,
        description: 'Test product description',
        category: { _id: 'cat1', name: 'Test Category' },
        location: 'TP. Hồ Chí Minh',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      buyCount: 2,
      price: 100000,
      priceBeforeDiscount: 120000
    }
  ],
  total: 200000,
  subtotal: 200000,
  shippingFee: 30000,
  discount: 0,
  coinsUsed: 0,
  coinsDiscount: 0,
  status: 'pending',
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
  shippingAddress: {
    _id: 'addr1',
    userId: 'user1',
    fullName: 'Test',
    phone: '0123456789',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    street: '123 Test Street',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  shippingMethod: {
    _id: 'ship1',
    name: 'Giao hàng tiêu chuẩn',
    description: 'Giao trong 3-5 ngày',
    price: 30000,
    estimatedDays: '3-5 ngày',
    icon: '📦'
  },
  paymentMethod: 'cod'
}

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('OrderCard', () => {
  it('renders order ID', () => {
    renderWithRouter(<OrderCard order={mockOrder} />)
    // order._id.slice(-8).toUpperCase() = '23456789'
    expect(screen.getByText('23456789')).toBeInTheDocument()
  })

  it('displays product information', () => {
    renderWithRouter(<OrderCard order={mockOrder} />)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('x2')).toBeInTheDocument()
  })

  it('renders cancel button for pending orders', () => {
    renderWithRouter(<OrderCard order={mockOrder} onCancel={vi.fn()} />)
    // Button component renders the text
    const cancelButtons = screen.getAllByRole('button')
    const cancelBtn = cancelButtons.find((btn) => btn.textContent?.includes('Hủy'))
    expect(cancelBtn).toBeTruthy()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderWithRouter(<OrderCard order={mockOrder} onCancel={onCancel} />)
    const cancelButtons = screen.getAllByRole('button')
    const cancelBtn = cancelButtons.find((btn) => btn.textContent?.includes('Hủy'))
    if (cancelBtn) {
      await user.click(cancelBtn)
      expect(onCancel).toHaveBeenCalledWith('order123456789')
    }
  })
})
