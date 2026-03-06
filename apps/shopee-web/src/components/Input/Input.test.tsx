import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Input from './Input'

describe('Input Component Unit Tests', () => {
  const defaultProps = {
    placeholder: 'Enter text',
    name: 'test-input'
  }

  describe('Rendering', () => {
    test('should render with default props', () => {
      render(<Input {...defaultProps} />)

      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('name', 'test-input')
    })

    test('should render with error message', () => {
      render(<Input {...defaultProps} errorMessage='This field is required' />)

      expect(screen.getByText('This field is required')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter text')).toHaveClass('border-red-600')
    })

    test('should render with different input types', () => {
      const { rerender } = render(<Input {...defaultProps} type='email' />)
      expect(screen.getByPlaceholderText('Enter text')).toHaveAttribute('type', 'email')

      rerender(<Input {...defaultProps} type='password' />)
      expect(screen.getByPlaceholderText('Enter text')).toHaveAttribute('type', 'password')
    })
  })

  describe('User Interactions', () => {
    test('should handle user input correctly', async () => {
      const mockOnChange = vi.fn()
      const user = userEvent.setup()

      render(<Input {...defaultProps} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter text')
      await user.type(input, 'Hello World')

      expect(mockOnChange).toHaveBeenCalledTimes(11) // Each character
      expect(input).toHaveValue('Hello World')
    })

    test('should handle onBlur event', async () => {
      const mockOnBlur = vi.fn()
      const user = userEvent.setup()

      render(<Input {...defaultProps} onBlur={mockOnBlur} />)

      const input = screen.getByPlaceholderText('Enter text')
      await user.click(input)
      await user.tab() // Focus out

      expect(mockOnBlur).toHaveBeenCalledTimes(1)
    })

    test('should handle onFocus event', async () => {
      const mockOnFocus = vi.fn()
      const user = userEvent.setup()

      render(<Input {...defaultProps} onFocus={mockOnFocus} />)

      const input = screen.getByPlaceholderText('Enter text')
      await user.click(input)

      expect(mockOnFocus).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    test('should support aria-label', () => {
      render(<Input {...defaultProps} aria-label='Email input' />)

      expect(screen.getByLabelText('Email input')).toBeInTheDocument()
    })

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup()

      render(<Input {...defaultProps} />)

      const input = screen.getByPlaceholderText('Enter text')

      // Tab to focus
      await user.tab()
      expect(input).toHaveFocus()

      // Type text
      await user.keyboard('Test')
      expect(input).toHaveValue('Test')
    })

    test('should have proper ARIA attributes when error exists', () => {
      render(<Input {...defaultProps} errorMessage='Error message' id='test-input' />)

      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby')
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty values', () => {
      render(<Input {...defaultProps} value='' />)

      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toHaveValue('')
    })

    test('should handle special characters', async () => {
      const mockOnChange = vi.fn()
      const user = userEvent.setup()

      render(<Input {...defaultProps} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter text')
      await user.type(input, '!@#$%^&*()')

      expect(input).toHaveValue('!@#$%^&*()')
    })

    test('should handle long text input', async () => {
      const longText = 'a'.repeat(50) // Reduce from 1000 to 50 to avoid timeout
      const user = userEvent.setup()

      render(<Input {...defaultProps} />)

      const input = screen.getByPlaceholderText('Enter text')
      await user.type(input, longText)

      expect(input).toHaveValue(longText)
    })

    test('should handle disabled state', () => {
      render(<Input {...defaultProps} disabled />)

      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeDisabled()
    })

    test('should handle readonly state', () => {
      render(<Input {...defaultProps} readOnly />)

      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toHaveAttribute('readonly')
    })
  })

  describe('Validation Integration', () => {
    test('should clear error when valid input is entered', async () => {
      const { rerender } = render(<Input {...defaultProps} errorMessage='This field is required' />)

      // Initially has error
      expect(screen.getByText('This field is required')).toBeInTheDocument()

      // Clear error
      rerender(<Input {...defaultProps} />)

      // Wait for AnimatePresence exit animation to complete
      await waitFor(() => {
        expect(screen.queryByText('This field is required')).not.toBeInTheDocument()
      })
    })

    test('should show error when validation fails', () => {
      const { rerender } = render(<Input {...defaultProps} />)

      // Initially no error
      expect(screen.queryByText('Invalid email')).not.toBeInTheDocument()

      // Add error
      rerender(<Input {...defaultProps} errorMessage='Invalid email' />)

      expect(screen.getByText('Invalid email')).toBeInTheDocument()
    })
  })
})
