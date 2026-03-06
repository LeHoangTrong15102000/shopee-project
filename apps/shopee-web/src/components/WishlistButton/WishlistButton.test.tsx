import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/utils/testUtils'
import WishlistButton from './WishlistButton'

vi.mock('src/hooks/optimistic', () => ({
  useOptimisticWishlist: vi.fn(() => ({
    isInWishlist: false,
    isLoading: false,
    isAuthenticated: true,
    toggleWishlist: vi.fn()
  }))
}))

describe('WishlistButton', () => {
  it('renders wishlist button', () => {
    renderWithProviders(<WishlistButton productId='product-1' />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    renderWithProviders(<WishlistButton productId='product-1' size='lg' />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-12', 'h-12')
  })

  it('has correct aria attributes', () => {
    renderWithProviders(<WishlistButton productId='product-1' />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveAttribute('aria-busy', 'false')
  })
})
