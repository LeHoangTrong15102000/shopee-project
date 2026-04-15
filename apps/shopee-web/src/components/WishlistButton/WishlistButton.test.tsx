import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/utils/testUtils'
import WishlistButton from './WishlistButton'

const mockToggleWishlist = vi.fn()

vi.mock('src/hooks/optimistic', () => ({
  useOptimisticWishlist: vi.fn(() => ({
    isInWishlist: false,
    isLoading: false,
    isAuthenticated: true,
    toggleWishlist: mockToggleWishlist,
  })),
}))

describe('WishlistButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders wishlist button', () => {
    renderWithProviders(<WishlistButton productId="product-1" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    renderWithProviders(<WishlistButton productId="product-1" size="lg" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-12', 'h-12')
  })

  it('has correct aria attributes when not in wishlist', () => {
    renderWithProviders(<WishlistButton productId="product-1" />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveAttribute('aria-busy', 'false')
  })

  it('calls toggleWishlist on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<WishlistButton productId="product-1" />)
    const button = screen.getByRole('button')
    await user.click(button)
    expect(mockToggleWishlist).toHaveBeenCalledTimes(1)
  })

  it('shows loading state when isLoading is true', async () => {
    const { useOptimisticWishlist } = await import('src/hooks/optimistic')
    ;(useOptimisticWishlist as ReturnType<typeof vi.fn>).mockReturnValue({
      isInWishlist: false,
      isLoading: true,
      isAuthenticated: true,
      toggleWishlist: mockToggleWishlist,
    })

    renderWithProviders(<WishlistButton productId="product-1" />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
  })

  it('shows pressed state when in wishlist', async () => {
    const { useOptimisticWishlist } = await import('src/hooks/optimistic')
    ;(useOptimisticWishlist as ReturnType<typeof vi.fn>).mockReturnValue({
      isInWishlist: true,
      isLoading: false,
      isAuthenticated: true,
      toggleWishlist: mockToggleWishlist,
    })

    renderWithProviders(<WishlistButton productId="product-1" />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('does not call toggleWishlist when not authenticated', async () => {
    const { useOptimisticWishlist } = await import('src/hooks/optimistic')
    ;(useOptimisticWishlist as ReturnType<typeof vi.fn>).mockReturnValue({
      isInWishlist: false,
      isLoading: false,
      isAuthenticated: false,
      toggleWishlist: mockToggleWishlist,
    })

    const user = userEvent.setup()
    renderWithProviders(<WishlistButton productId="product-1" />)
    const button = screen.getByRole('button')
    await user.click(button)
    // toggleWishlist should NOT be called when not authenticated
    expect(mockToggleWishlist).not.toHaveBeenCalled()
  })
})
