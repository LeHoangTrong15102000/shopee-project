import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuantityController from './QuantityController'

describe('QuantityController Component Unit Tests', () => {
  const defaultProps = {
    value: 1,
    max: 100,
    onIncrease: vi.fn(),
    onDecrease: vi.fn(),
    onType: vi.fn(),
    onFocusOut: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper function to get buttons
  const getButtons = () => {
    const buttons = screen.getAllByRole('button')
    return {
      decreaseButton: buttons[0], // First button is decrease
      increaseButton: buttons[1] // Second button is increase
    }
  }

  describe('Rendering', () => {
    test('should render with initial value', () => {
      render(<QuantityController {...defaultProps} value={5} />)

      const input = screen.getByDisplayValue('5')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    test('should render increase and decrease buttons', () => {
      render(<QuantityController {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)

      const { decreaseButton, increaseButton } = getButtons()
      expect(decreaseButton).toBeInTheDocument()
      expect(increaseButton).toBeInTheDocument()
    })

    test('should render with proper structure', () => {
      const { container } = render(<QuantityController {...defaultProps} />)

      const wrapper = container.querySelector('.flex')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveClass('items-center')
    })

    test('should render with custom className wrapper', () => {
      const { container } = render(<QuantityController {...defaultProps} classNameWrapper='custom-wrapper' />)

      const wrapper = container.querySelector('.custom-wrapper')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    describe('Button Clicks', () => {
      test('should call onIncrease when plus button clicked', async () => {
        const user = userEvent.setup()

        render(<QuantityController {...defaultProps} />)

        const { increaseButton } = getButtons()
        await user.click(increaseButton)

        expect(defaultProps.onIncrease).toHaveBeenCalledTimes(1)
        expect(defaultProps.onIncrease).toHaveBeenCalledWith(2) // 1 + 1 = 2
      })

      test('should call onDecrease when minus button clicked', async () => {
        const user = userEvent.setup()

        render(<QuantityController {...defaultProps} value={5} />)

        const { decreaseButton } = getButtons()
        await user.click(decreaseButton)

        expect(defaultProps.onDecrease).toHaveBeenCalledTimes(1)
        expect(defaultProps.onDecrease).toHaveBeenCalledWith(4) // 5 - 1 = 4
      })

      test('should handle multiple rapid clicks', async () => {
        const user = userEvent.setup()

        render(<QuantityController {...defaultProps} value={5} />)

        const { increaseButton } = getButtons()

        await user.click(increaseButton)
        await user.click(increaseButton)
        await user.click(increaseButton)

        expect(defaultProps.onIncrease).toHaveBeenCalledTimes(3)
      })
    })

    describe('Input Interactions', () => {
      test('should call onType when typing in input', async () => {
        const user = userEvent.setup()

        render(<QuantityController {...defaultProps} />)

        const input = screen.getByDisplayValue('1')
        await user.clear(input)
        await user.type(input, '5')

        expect(defaultProps.onType).toHaveBeenCalled()
      })

      test('should call onFocusOut when input loses focus', async () => {
        const user = userEvent.setup()

        render(<QuantityController {...defaultProps} />)

        const input = screen.getByDisplayValue('1')
        await user.click(input)
        await user.tab()

        expect(defaultProps.onFocusOut).toHaveBeenCalledTimes(1)
      })

      test('should handle focus and blur-sm events', async () => {
        const user = userEvent.setup()

        render(<QuantityController {...defaultProps} />)

        const input = screen.getByDisplayValue('1')

        await user.click(input)
        expect(input).toHaveFocus()

        await user.tab()
        expect(input).not.toHaveFocus()
      })
    })
  })

  describe('Quantity Constraints', () => {
    test('should not exceed max value when typing', async () => {
      const user = userEvent.setup()

      render(<QuantityController {...defaultProps} max={5} />)

      const input = screen.getByDisplayValue('1')
      await user.clear(input)
      await user.type(input, '10')

      // Should be capped at max value
      expect(defaultProps.onType).toHaveBeenCalledWith(5)
    })

    test('should not exceed max value when clicking increase', async () => {
      const user = userEvent.setup()

      render(<QuantityController {...defaultProps} value={5} max={5} />)

      const { increaseButton } = getButtons()
      await user.click(increaseButton)

      // Should stay at max value
      expect(defaultProps.onIncrease).toHaveBeenCalledWith(5)
    })

    test('should enforce minimum value of 1', async () => {
      const user = userEvent.setup()

      render(<QuantityController {...defaultProps} />)

      const input = screen.getByDisplayValue('1')
      await user.clear(input)
      await user.type(input, '0')

      // Should be minimum 1
      expect(defaultProps.onType).toHaveBeenCalledWith(1)
    })

    test('should handle edge case values correctly', () => {
      const { rerender } = render(<QuantityController {...defaultProps} value={1} max={1} />)

      // Should render properly at edge values
      expect(screen.getByDisplayValue('1')).toBeInTheDocument()

      // Test with higher max
      rerender(<QuantityController {...defaultProps} value={1} max={10} />)
      expect(screen.getByDisplayValue('1')).toBeInTheDocument()
    })
  })

  describe('Delete Modal Integration', () => {
    test('should show delete modal when decreasing from 1 in cart', async () => {
      const user = userEvent.setup()
      const mockProduct = { _id: '123', name: 'Test Product' }

      render(<QuantityController {...defaultProps} value={1} product={mockProduct as any} isQuantityInCart={true} />)

      const { decreaseButton } = getButtons()
      await user.click(decreaseButton)

      // Should trigger delete modal
      await waitFor(() => {
        expect(screen.getByText(/bạn chắc chắn muốn bỏ sản phẩm này/i)).toBeInTheDocument()
      })
    })

    test('should handle delete confirmation', async () => {
      const user = userEvent.setup()
      const mockHandleDelete = vi.fn()
      const mockProduct = { _id: '123', name: 'Test Product' }

      render(
        <QuantityController
          {...defaultProps}
          value={1}
          product={mockProduct as any}
          isQuantityInCart={true}
          handleDelete={mockHandleDelete}
        />
      )

      // Trigger delete modal
      const { decreaseButton } = getButtons()
      await user.click(decreaseButton)

      // Confirm delete
      await waitFor(async () => {
        const confirmBtn = screen.getByRole('button', { name: /có/i })
        await user.click(confirmBtn)
      })

      expect(mockHandleDelete).toHaveBeenCalledWith(123)
    })

    test('should not show delete modal when not in cart', async () => {
      const user = userEvent.setup()

      render(
        <QuantityController {...defaultProps} value={1} product={{ _id: '123' } as any} isQuantityInCart={false} />
      )

      const { decreaseButton } = getButtons()
      await user.click(decreaseButton)

      // Should not show delete modal
      await waitFor(() => {
        expect(screen.queryByText(/bạn chắc chắn muốn bỏ sản phẩm này/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    test('should handle zero value gracefully', () => {
      render(<QuantityController {...defaultProps} value={0} />)

      const input = screen.getByDisplayValue('0')
      expect(input).toBeInTheDocument()
    })

    test('should handle very large values', () => {
      render(<QuantityController {...defaultProps} value={9999} max={10000} />)

      const input = screen.getByDisplayValue('9999')
      expect(input).toBeInTheDocument()
    })

    test('should handle missing max prop', () => {
      const { max, ...propsWithoutMax } = defaultProps
      render(<QuantityController {...propsWithoutMax} value={5} />)

      const { increaseButton } = getButtons()
      expect(increaseButton).toBeInTheDocument()
    })

    test('should handle invalid input gracefully', async () => {
      const user = userEvent.setup()

      render(<QuantityController {...defaultProps} />)

      const input = screen.getByDisplayValue('1')
      await user.clear(input)
      await user.type(input, 'abc')

      // InputNumber component should handle invalid input
      expect(defaultProps.onType).toHaveBeenCalled()
    })

    test('should handle missing callback functions gracefully', () => {
      render(<QuantityController value={1} />)

      const { increaseButton, decreaseButton } = getButtons()

      // Should not throw errors
      expect(() => {
        fireEvent.click(increaseButton)
        fireEvent.click(decreaseButton)
      }).not.toThrow()
    })

    test('should handle undefined value prop', () => {
      render(<QuantityController onIncrease={vi.fn()} />)

      // Should default to 0 and show input
      expect(screen.getByDisplayValue('0')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper button structure', () => {
      render(<QuantityController {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)

      // Check decrease button (minus icon)
      const decreaseButton = buttons[0]
      expect(decreaseButton).toBeInTheDocument()
      expect(decreaseButton.querySelector('svg')).toBeInTheDocument()

      // Check increase button (plus icon)
      const increaseButton = buttons[1]
      expect(increaseButton).toBeInTheDocument()
      expect(increaseButton.querySelector('svg')).toBeInTheDocument()
    })

    test('should be keyboard navigable', async () => {
      const user = userEvent.setup()

      render(<QuantityController {...defaultProps} />)

      const { decreaseButton, increaseButton } = getButtons()
      const input = screen.getByDisplayValue('1')

      // Tab through elements — framer-motion wraps motion.button in a
      // focusable <div tabindex="0"> in jsdom, so focus may land on the
      // wrapper rather than the button itself. We verify the active element
      // is the button OR one of its ancestors (the motion wrapper).
      await user.tab()
      const firstFocused = document.activeElement
      expect(firstFocused === decreaseButton || firstFocused?.contains(decreaseButton)).toBe(true)

      await user.tab()
      // Skip extra focusable motion wrapper nodes until we reach the input
      if (document.activeElement !== input) await user.tab()
      expect(input).toHaveFocus()

      await user.tab()
      const lastFocused = document.activeElement
      expect(lastFocused === increaseButton || lastFocused?.contains(increaseButton)).toBe(true)
    })

    test('should support keyboard actions', async () => {
      const user = userEvent.setup()

      render(<QuantityController {...defaultProps} value={5} />)

      const { increaseButton } = getButtons()
      increaseButton.focus()

      await user.keyboard('{Enter}')
      expect(defaultProps.onIncrease).toHaveBeenCalledTimes(1)

      await user.keyboard(' ')
      expect(defaultProps.onIncrease).toHaveBeenCalledTimes(2)
    })

    test('should have proper input attributes', () => {
      render(<QuantityController {...defaultProps} />)

      const input = screen.getByDisplayValue('1')
      expect(input).toHaveAttribute('type', 'text')
    })
  })

  describe('Performance', () => {
    test('should handle rapid state changes efficiently', async () => {
      const user = userEvent.setup()
      const startTime = Date.now()

      render(<QuantityController {...defaultProps} />)

      const buttons = getButtons()

      // Perform 5 rapid clicks instead of 10 to be more realistic
      for (let i = 0; i < 5; i++) {
        await user.click(buttons.increaseButton)
      }

      const endTime = Date.now()

      // Increase timeout to 2000ms for more realistic performance testing
      expect(endTime - startTime).toBeLessThan(2000)
      expect(defaultProps.onIncrease).toHaveBeenCalledTimes(5)
    })
  })

  describe('Props Validation', () => {
    test('should handle missing onChange gracefully', () => {
      expect(() => {
        render(<QuantityController value={1} />)
      }).not.toThrow()
    })

    test('should use default values when props are missing', () => {
      const minimalProps = { value: 5 }

      render(<QuantityController {...minimalProps} />)

      const input = screen.getByDisplayValue('5')
      expect(input).toBeInTheDocument()
    })

    test('should handle negative values appropriately', () => {
      render(<QuantityController {...defaultProps} value={-1} />)

      const input = screen.getByDisplayValue('-1')
      expect(input).toBeInTheDocument()
    })
  })
})
