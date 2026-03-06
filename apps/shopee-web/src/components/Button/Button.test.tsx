import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import Button from './Button'

describe('Button Component Unit Tests', () => {
  describe('Rendering', () => {
    test('should render with children text', () => {
      render(<Button>Click me</Button>)

      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    test('should render with different variants', () => {
      const { rerender } = render(<Button className='bg-orange'>Primary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-orange')

      rerender(<Button className='bg-white'>Secondary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-white')
    })

    test('should render as link when href is provided', () => {
      render(
        <BrowserRouter>
          <Button as='link' to='/test'>
            Link Button
          </Button>
        </BrowserRouter>
      )

      // Should render as anchor or Link component
      const element = screen.getByText('Link Button')
      expect(element.closest('a') || element.closest('[data-testid="link"]')).toBeTruthy()
    })
  })

  describe('Variants and Sizes', () => {
    test('should render icon variant with correct classes', () => {
      render(<Button variant='icon'>🔍</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-full')
      expect(button).toHaveClass('p-2')
      expect(button).toHaveClass('bg-transparent')
      // Icon variant uses ring focus instead of outline
      expect(button.className).toContain('focus-visible:ring-2')
      expect(button.className).toContain('focus-visible:ring-orange')
    })

    test('should render xs size with correct classes', () => {
      render(<Button size='xs'>Tiny</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-2')
      expect(button).toHaveClass('py-0.5')
      expect(button).toHaveClass('text-xs')
    })

    test('should render shape pill with correct classes', () => {
      render(<Button shape='pill'>Pill</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-full')
    })

    test('should render shape rounded with correct classes', () => {
      render(<Button shape='rounded'>Rounded</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-md')
    })

    test('should render animated={false} without hover transition classes', () => {
      render(<Button animated={false}>Static</Button>)

      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('transition-all')
      expect(button).not.toHaveClass('duration-150')
      // Should still be a plain button element
      expect(button.tagName).toBe('BUTTON')
    })

    test('should render animated={true} (default) with hover transition classes', () => {
      render(<Button>Animated</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('transition-all')
      expect(button).toHaveClass('duration-150')
    })
  })

  describe('User Interactions', () => {
    test('should handle click events', async () => {
      const mockOnClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={mockOnClick}>Click me</Button>)

      await user.click(screen.getByRole('button'))

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    test('should not trigger click when disabled', async () => {
      const mockOnClick = vi.fn()
      const user = userEvent.setup()

      render(
        <Button onClick={mockOnClick} disabled>
          Disabled
        </Button>
      )

      await user.click(screen.getByRole('button'))

      expect(mockOnClick).not.toHaveBeenCalled()
    })

    test('should handle keyboard interactions', async () => {
      const mockOnClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={mockOnClick}>Keyboard Test</Button>)

      const button = screen.getByRole('button')
      await user.tab() // Focus the button
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockOnClick).toHaveBeenCalledTimes(1)

      await user.keyboard(' ') // Space key
      expect(mockOnClick).toHaveBeenCalledTimes(2)
    })
  })

  describe('States', () => {
    test('should render disabled state correctly', () => {
      render(<Button disabled>Disabled Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('cursor-not-allowed')
    })

    test('should render loading state', () => {
      render(<Button isLoading>Loading Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()

      // Should show loading indicator
      expect(button).toHaveClass('cursor-not-allowed')
      // If you have a loading spinner, test for it here
    })

    test('should handle different sizes', () => {
      const { rerender } = render(<Button className='h-8'>Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-8')

      rerender(<Button className='h-12'>Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-12')
    })
  })

  describe('Accessibility', () => {
    test('should support aria-label', () => {
      render(<Button aria-label='Close dialog'>×</Button>)

      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument()
    })

    test('should support aria-describedby', () => {
      render(
        <div>
          <Button aria-describedby='button-description'>Action</Button>
          <div id='button-description'>This button performs an action</div>
        </div>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby', 'button-description')
    })

    test('should have proper focus management', async () => {
      const user = userEvent.setup()

      render(<Button>Focus Test</Button>)

      const button = screen.getByRole('button')

      await user.tab()
      expect(button).toHaveFocus()

      await user.tab()
      expect(button).not.toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    test('should handle multiple clicks rapidly', async () => {
      const mockOnClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={mockOnClick}>Rapid Click</Button>)

      const button = screen.getByRole('button')

      // Click multiple times rapidly
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(mockOnClick).toHaveBeenCalledTimes(3)
    })

    test('should render without children', () => {
      render(<Button />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    test('should handle complex children content', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )

      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })

    test('should forward ref correctly', () => {
      const ref = vi.fn()

      render(<Button ref={ref}>Ref Test</Button>)

      expect(ref).toHaveBeenCalled()
    })
  })

  describe('Form Integration', () => {
    test('should work as submit button in forms', async () => {
      const mockOnSubmit = vi.fn((e) => e.preventDefault())

      render(
        <form onSubmit={mockOnSubmit}>
          <Button type='submit'>Submit</Button>
        </form>
      )

      // Click the submit button - this should trigger form submission
      const button = screen.getByRole('button')

      // Ensure button has correct type
      expect(button).toHaveAttribute('type', 'submit')

      // Click button should trigger form submit
      fireEvent.click(button)

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    test('should work as reset button in forms', () => {
      render(
        <form>
          <input defaultValue='test' />
          <Button type='reset'>Reset</Button>
        </form>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'reset')
    })
  })
})
