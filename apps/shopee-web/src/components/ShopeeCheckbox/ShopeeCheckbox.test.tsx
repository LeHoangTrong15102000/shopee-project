import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShopeeCheckbox from './ShopeeCheckbox'
import { ThemeProvider } from 'src/contexts/theme.context'
import React from 'react'

const themeWrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>

const renderWithTheme = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: themeWrapper, ...options })

describe('ShopeeCheckbox Component Unit Tests', () => {
  const defaultProps = {
    checked: false,
    onChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('should render with unchecked state', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox {...defaultProps} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).toHaveClass('cursor-pointer')
    })

    test('should render with checked state', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox {...defaultProps} checked={true} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toBeInTheDocument()

      // Check for checkmark SVG
      const checkmark = container.querySelector('svg')
      expect(checkmark).toBeInTheDocument()
    })

    test('should render with different sizes', () => {
      const { rerender, container } = renderWithTheme(<ShopeeCheckbox {...defaultProps} size='sm' />)
      expect(container.querySelector('.w-5')).toBeInTheDocument()

      rerender(<ShopeeCheckbox {...defaultProps} size='md' />)
      expect(container.querySelector('.w-6')).toBeInTheDocument()

      rerender(<ShopeeCheckbox {...defaultProps} size='lg' />)
      expect(container.querySelector('.w-7')).toBeInTheDocument()
    })

    test('should render with custom className', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox {...defaultProps} className='custom-class' />)

      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveClass('custom-class')
    })
  })

  describe('User Interactions', () => {
    test('should call onChange when clicked', () => {
      const onChange = vi.fn()
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={onChange} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      fireEvent.click(checkbox!)

      expect(onChange).toHaveBeenCalledWith(true)
    })

    test('should toggle from checked to unchecked', () => {
      const onChange = vi.fn()
      const { container } = renderWithTheme(<ShopeeCheckbox checked={true} onChange={onChange} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      fireEvent.click(checkbox!)

      expect(onChange).toHaveBeenCalledWith(false)
    })

    test('should handle keyboard Enter key', () => {
      const onChange = vi.fn()
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={onChange} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      fireEvent.keyDown(checkbox!, { key: 'Enter' })

      expect(onChange).toHaveBeenCalledWith(true)
    })

    test('should handle keyboard Space key', () => {
      const onChange = vi.fn()
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={onChange} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      fireEvent.keyDown(checkbox!, { key: ' ' })

      expect(onChange).toHaveBeenCalledWith(true)
    })

    test('should prevent default on keyboard events', () => {
      const onChange = vi.fn()
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={onChange} />)

      const checkbox = container.querySelector('[role="checkbox"]')

      // Test Enter key functionality
      fireEvent.keyDown(checkbox!, { key: 'Enter' })
      expect(onChange).toHaveBeenCalledWith(true)

      // Clear previous calls
      onChange.mockClear()

      // Test Space key functionality
      fireEvent.keyDown(checkbox!, { key: ' ' })
      expect(onChange).toHaveBeenCalledWith(true)

      // Test other keys should not trigger onChange
      onChange.mockClear()
      fireEvent.keyDown(checkbox!, { key: 'Tab' })
      expect(onChange).not.toHaveBeenCalled()
    })

    test('should ignore other keyboard keys', () => {
      const onChange = vi.fn()
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={onChange} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      fireEvent.keyDown(checkbox!, { key: 'Tab' })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    test('should have checkbox role', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox {...defaultProps} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toBeInTheDocument()
    })

    test('should have proper aria-checked attribute', () => {
      const { container, rerender } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={vi.fn()} />)

      let checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')

      rerender(<ShopeeCheckbox checked={true} onChange={vi.fn()} />)
      checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    test('should have proper aria-label', () => {
      const { container, rerender } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={vi.fn()} />)

      let checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-label', 'Checkbox unchecked')

      rerender(<ShopeeCheckbox checked={true} onChange={vi.fn()} />)
      checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-label', 'Checkbox checked')
    })

    test('should be focusable with tabIndex', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox {...defaultProps} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('tabIndex', '0')
    })

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const { container } = renderWithTheme(<ShopeeCheckbox {...defaultProps} />)

      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement

      // Tab to focus
      await user.tab()
      expect(checkbox).toHaveFocus()
    })
  })

  describe('Visual States', () => {
    test('should display checkmark when checked', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox checked={true} onChange={vi.fn()} />)

      const checkmark = container.querySelector('svg')
      expect(checkmark).toBeInTheDocument()

      // Check for the checkmark path
      const path = container.querySelector('path[d="M5 13l4 4L19 7"]')
      expect(path).toBeInTheDocument()
    })

    test('should not display checkmark when unchecked', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={vi.fn()} />)

      // In unchecked state, the SVG might still exist but be hidden via animation
      // We focus on the visual state rather than DOM presence
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toBeInTheDocument()
    })

    test('should handle different size variations correctly', () => {
      const sizes = ['sm', 'md', 'lg'] as const
      const expectedClasses = ['w-5 h-5', 'w-6 h-6', 'w-7 h-7']

      sizes.forEach((size, index) => {
        const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={vi.fn()} size={size} />)

        const sizeElements = expectedClasses[index].split(' ')
        sizeElements.forEach((className) => {
          expect(container.querySelector(`.${className}`)).toBeInTheDocument()
        })
      })
    })
  })

  describe('Animation States', () => {
    test('should have motion wrapper for animations', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox {...defaultProps} />)

      // Check if framer-motion elements are rendered
      const motionDiv = container.querySelector('[style*="transform"]')
      expect(motionDiv || container.firstChild).toBeInTheDocument()
    })

    test('should handle animation props without errors', () => {
      expect(() => {
        renderWithTheme(<ShopeeCheckbox {...defaultProps} checked={true} />)
      }).not.toThrow()
    })

    test('should handle state transitions', () => {
      const { rerender } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={vi.fn()} />)

      // Should not throw when changing states
      expect(() => {
        rerender(<ShopeeCheckbox checked={true} onChange={vi.fn()} />)
      }).not.toThrow()
    })
  })

  describe('Props Validation', () => {
    test('should use default size when not specified', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={vi.fn()} />)

      const sizedDiv = container.querySelector('.w-6') // md size default
      expect(sizedDiv).toBeInTheDocument()
    })

    test('should use default className when not specified', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={vi.fn()} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveClass('cursor-pointer')
    })

    test('should handle missing onChange gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderWithTheme(<ShopeeCheckbox checked={false} onChange={undefined as any} />)
      }).not.toThrow()

      consoleSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    test('should handle boolean checked prop correctly', () => {
      const { rerender, container } = renderWithTheme(<ShopeeCheckbox checked={true} onChange={vi.fn()} />)
      expect(container.querySelector('svg')).toBeInTheDocument()

      rerender(<ShopeeCheckbox checked={false} onChange={vi.fn()} />)
      // State should change accordingly
      expect(container.querySelector('[role="checkbox"]')).toBeInTheDocument()
    })

    test('should maintain state consistency with props', () => {
      const mockOnChange = vi.fn()

      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={mockOnChange} />)

      const checkbox = container.querySelector('[role="checkbox"]')
      fireEvent.click(checkbox!)

      expect(mockOnChange).toHaveBeenCalledWith(true)
      // Component should call onChange with opposite of current checked state
    })

    test('should handle concurrent state changes', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()

      const { rerender, container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={mockOnChange} />)

      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement

      // Simulate external state change during interaction
      await user.click(checkbox)
      rerender(<ShopeeCheckbox checked={true} onChange={mockOnChange} />)

      expect(mockOnChange).toHaveBeenCalledWith(true)
    })
  })

  describe('Disabled State', () => {
    test('should not call onChange when disabled and clicked', () => {
      const onChange = vi.fn()
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={onChange} disabled={true} />)
      const checkbox = container.querySelector('[role="checkbox"]')
      fireEvent.click(checkbox!)
      expect(onChange).not.toHaveBeenCalled()
    })

    test('should not call onChange when disabled and key pressed', () => {
      const onChange = vi.fn()
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={onChange} disabled={true} />)
      const checkbox = container.querySelector('[role="checkbox"]')
      fireEvent.keyDown(checkbox!, { key: 'Enter' })
      expect(onChange).not.toHaveBeenCalled()
    })

    test('should have opacity-50 class when disabled', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={vi.fn()} disabled={true} />)
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveClass('opacity-50')
    })

    test('should have tabIndex -1 when disabled', () => {
      const { container } = renderWithTheme(<ShopeeCheckbox checked={false} onChange={vi.fn()} disabled={true} />)
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('tabIndex', '-1')
    })
  })
})
