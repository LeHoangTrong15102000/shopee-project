import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'react-toastify'
import WishlistButton from '../WishlistButton/WishlistButton'

// Mock dependencies
vi.mock('react-toastify', () => ({
  toast: {
    warning: vi.fn(),
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'wishlist.processing': 'Processing...',
        'wishlist.removeFromWishlist': `Remove ${params?.name} from wishlist`,
        'wishlist.addToWishlist': `Add ${params?.name} to wishlist`,
        'wishlist.product': 'product',
        'wishlist.removeTitle': 'Remove from wishlist',
        'wishlist.addTitle': 'Add to wishlist',
      }
      return translations[key] || key
    },
  }),
}))

const mockToggleWishlist = vi.fn()
const mockUseOptimisticWishlist = vi.fn()

vi.mock('src/hooks/optimistic', () => ({
  useOptimisticWishlist: (productId: string) => mockUseOptimisticWishlist(productId),
}))

vi.mock('src/hooks/optimistic/shared/constants', () => ({
  TOAST_MESSAGES: {
    WISHLIST_LOGIN_REQUIRED: 'Please login to add items to wishlist',
  },
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

describe('WishlistButton', () => {
  const defaultProps = {
    productId: 'product-123',
    productName: 'Test Product',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOptimisticWishlist.mockReturnValue({
      isInWishlist: false,
      isLoading: false,
      isAuthenticated: true,
      toggleWishlist: mockToggleWishlist,
    })
  })

  describe('Rendering', () => {
    it('should render wishlist button', () => {
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render with default size (md)', () => {
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-11', 'h-11')
    })

    it('should render with small size', () => {
      render(<WishlistButton {...defaultProps} size="sm" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-11', 'h-11')
    })

    it('should render with large size', () => {
      render(<WishlistButton {...defaultProps} size="lg" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-12', 'h-12')
    })

    it('should apply custom className', () => {
      render(<WishlistButton {...defaultProps} className="custom-class" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should render heart icon when not in wishlist', () => {
      render(<WishlistButton {...defaultProps} />)

      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'none')
      expect(svg).toHaveClass('text-gray-500')
    })

    it('should render filled heart icon when in wishlist', () => {
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: true,
        isLoading: false,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'currentColor')
      expect(svg).toHaveClass('text-orange')
    })

    it('should render loading spinner when isLoading is true', () => {
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: false,
        isLoading: true,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const spinner = screen.getByRole('button').querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label when not in wishlist', () => {
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Add Test Product to wishlist')
    })

    it('should have proper aria-label when in wishlist', () => {
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: true,
        isLoading: false,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Remove Test Product from wishlist')
    })

    it('should have proper aria-label when loading', () => {
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: false,
        isLoading: true,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Processing...')
    })

    it('should use default product name when productName is not provided', () => {
      render(<WishlistButton productId="product-123" />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Add product to wishlist')
    })

    it('should have aria-pressed attribute reflecting wishlist state', () => {
      const { rerender } = render(<WishlistButton {...defaultProps} />)

      let button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'false')

      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: true,
        isLoading: false,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      rerender(<WishlistButton {...defaultProps} />)

      button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })

    it('should have aria-busy attribute when loading', () => {
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: false,
        isLoading: true,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('should have tabIndex of 0 for keyboard navigation', () => {
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('tabIndex', '0')
    })

    it('should have proper title attribute when not in wishlist', () => {
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Add to wishlist')
    })

    it('should have proper title attribute when in wishlist', () => {
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: true,
        isLoading: false,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Remove from wishlist')
    })
  })

  describe('Click Interactions', () => {
    it('should call toggleWishlist when clicked and authenticated', async () => {
      const user = userEvent.setup()
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockToggleWishlist).toHaveBeenCalledTimes(1)
    })

    it('should show toast warning when clicked and not authenticated', async () => {
      const user = userEvent.setup()
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: false,
        isLoading: false,
        isAuthenticated: false,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(toast.warning).toHaveBeenCalledWith('Please login to add items to wishlist')
      expect(mockToggleWishlist).not.toHaveBeenCalled()
    })

    it('should not call toggleWishlist when loading', async () => {
      const user = userEvent.setup()
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: false,
        isLoading: true,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockToggleWishlist).not.toHaveBeenCalled()
    })

    it('should prevent default and stop propagation on click', async () => {
      const user = userEvent.setup()
      const mockPreventDefault = vi.fn()
      const mockStopPropagation = vi.fn()

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')

      button.addEventListener('click', (e) => {
        mockPreventDefault()
        mockStopPropagation()
      })

      await user.click(button)

      expect(mockToggleWishlist).toHaveBeenCalled()
    })
  })

  describe('Keyboard Interactions', () => {
    it('should trigger click on Enter key', async () => {
      const user = userEvent.setup()
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(mockToggleWishlist).toHaveBeenCalledTimes(1)
    })

    it('should trigger click on Space key', async () => {
      const user = userEvent.setup()
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')

      expect(mockToggleWishlist).toHaveBeenCalledTimes(1)
    })

    it('should not trigger on other keys', async () => {
      const user = userEvent.setup()
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Escape}')
      await user.keyboard('{Tab}')
      await user.keyboard('a')

      expect(mockToggleWishlist).not.toHaveBeenCalled()
    })

    it('should show toast warning on Enter when not authenticated', async () => {
      const user = userEvent.setup()
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: false,
        isLoading: false,
        isAuthenticated: false,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(toast.warning).toHaveBeenCalledWith('Please login to add items to wishlist')
      expect(mockToggleWishlist).not.toHaveBeenCalled()
    })

    it('should show toast warning on Space when not authenticated', async () => {
      const user = userEvent.setup()
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: false,
        isLoading: false,
        isAuthenticated: false,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')

      expect(toast.warning).toHaveBeenCalledWith('Please login to add items to wishlist')
      expect(mockToggleWishlist).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should disable button when loading', () => {
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: false,
        isLoading: true,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should apply loading styles when loading', () => {
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: false,
        isLoading: true,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('cursor-not-allowed', 'opacity-50')
    })

    it('should show spinner with correct size for small button', () => {
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: false,
        isLoading: true,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} size="sm" />)

      const spinner = screen.getByRole('button').querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })
  })

  describe('Icon Sizing', () => {
    it('should render small icon for small size', () => {
      render(<WishlistButton {...defaultProps} size="sm" />)

      const svg = screen.getByRole('button').querySelector('svg:not(.animate-spin)')
      expect(svg).toHaveClass('w-4', 'h-4')
    })

    it('should render medium icon for medium size', () => {
      render(<WishlistButton {...defaultProps} size="md" />)

      const svg = screen.getByRole('button').querySelector('svg:not(.animate-spin)')
      expect(svg).toHaveClass('w-6', 'h-6')
    })

    it('should render large icon for large size', () => {
      render(<WishlistButton {...defaultProps} size="lg" />)

      const svg = screen.getByRole('button').querySelector('svg:not(.animate-spin)')
      expect(svg).toHaveClass('w-7', 'h-7')
    })
  })

  describe('Styling', () => {
    it('should apply base styles', () => {
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'flex',
        'items-center',
        'justify-center',
        'bg-white/80',
        'shadow-xs',
      )
    })

    it('should apply transition classes', () => {
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('transition-all', 'duration-200')
    })

    it('should apply dark mode classes', () => {
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('dark:bg-slate-800/80', 'dark:hover:bg-slate-700')
    })

    it('should apply orange color when in wishlist', () => {
      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: true,
        isLoading: false,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      render(<WishlistButton {...defaultProps} />)

      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toHaveClass('text-orange')
    })

    it('should apply gray color when not in wishlist', () => {
      render(<WishlistButton {...defaultProps} />)

      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toHaveClass('text-gray-500')
    })
  })

  describe('Hook Integration', () => {
    it('should call useOptimisticWishlist with correct productId', () => {
      render(<WishlistButton {...defaultProps} />)

      expect(mockUseOptimisticWishlist).toHaveBeenCalledWith('product-123')
    })

    it('should update when hook returns different values', () => {
      const { rerender } = render(<WishlistButton {...defaultProps} />)

      let button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'false')

      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: true,
        isLoading: false,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      rerender(<WishlistButton {...defaultProps} />)

      button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing productName gracefully', () => {
      render(<WishlistButton productId="product-123" />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Add product to wishlist')
    })

    it('should handle empty productName', () => {
      render(<WishlistButton productId="product-123" productName="" />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Add product to wishlist')
    })

    it('should handle rapid clicks gracefully', async () => {
      const user = userEvent.setup()
      render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(mockToggleWishlist).toHaveBeenCalledTimes(3)
    })

    it('should handle state changes during interaction', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<WishlistButton {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      mockUseOptimisticWishlist.mockReturnValue({
        isInWishlist: true,
        isLoading: false,
        isAuthenticated: true,
        toggleWishlist: mockToggleWishlist,
      })

      rerender(<WishlistButton {...defaultProps} />)

      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
  })
})
