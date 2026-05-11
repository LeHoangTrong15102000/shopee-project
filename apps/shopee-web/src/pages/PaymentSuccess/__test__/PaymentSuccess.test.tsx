import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import React from 'react'
import PaymentSuccess from '../PaymentSuccess'

// Mock react-i18next — paymentSuccess namespace keys
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}))

// Mock react-router hooks
const mockNavigate = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  }
})

describe('PaymentSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  describe('redirect guard — no orderId', () => {
    it('redirects to order list when orderId is absent from search params', () => {
      mockSearchParams = new URLSearchParams()
      render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      expect(mockNavigate).toHaveBeenCalledWith('/user/order', { replace: true })
    })

    it('renders nothing (null) when orderId is absent', () => {
      mockSearchParams = new URLSearchParams()
      const { container } = render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('with a valid orderId', () => {
    beforeEach(() => {
      mockSearchParams = new URLSearchParams({ orderId: 'ORDER-12345' })
    })

    it('does not redirect when orderId is present', () => {
      render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('displays the orderId from search params', () => {
      render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      expect(screen.getByText('ORDER-12345')).toBeInTheDocument()
    })

    it('renders the heading translation key', () => {
      render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      expect(screen.getByText('heading')).toBeInTheDocument()
    })

    it('renders the subtext translation key', () => {
      render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      expect(screen.getByText('subtext')).toBeInTheDocument()
    })

    it('renders the orderIdLabel translation key', () => {
      render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      expect(screen.getByText(/orderIdLabel/)).toBeInTheDocument()
    })

    it('renders the "View Order" button with viewOrder translation key', () => {
      render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      const viewOrderBtn = screen.getByRole('button', { name: 'viewOrder' })
      expect(viewOrderBtn).toBeInTheDocument()
    })

    it('renders the "Continue Shopping" button with continueShopping translation key', () => {
      render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      const continueBtn = screen.getByRole('button', { name: 'continueShopping' })
      expect(continueBtn).toBeInTheDocument()
    })

    it('navigates to order list when "View Order" button is clicked', () => {
      render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      const viewOrderBtn = screen.getByRole('button', { name: 'viewOrder' })
      fireEvent.click(viewOrderBtn)
      expect(mockNavigate).toHaveBeenCalledWith('/user/order')
    })

    it('navigates to home when "Continue Shopping" button is clicked', () => {
      render(
        <MemoryRouter>
          <PaymentSuccess />
        </MemoryRouter>,
      )
      const continueBtn = screen.getByRole('button', { name: 'continueShopping' })
      fireEvent.click(continueBtn)
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
