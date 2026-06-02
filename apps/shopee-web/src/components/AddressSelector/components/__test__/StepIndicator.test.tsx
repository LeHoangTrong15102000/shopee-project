import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StepIndicator from '../StepIndicator'

describe('StepIndicator', () => {
  const defaultProps = {
    currentStep: 1,
    stepProgress: 0,
    canProceedToStep: (step: number) => step <= 1,
    onStepClick: vi.fn(),
  }

  it('renders all 3 steps', () => {
    render(<StepIndicator {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(3)
  })

  it('marks current step with aria-current', () => {
    render(<StepIndicator {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('aria-current', 'step')
    expect(buttons[1]).not.toHaveAttribute('aria-current')
  })

  it('shows step numbers for non-completed steps', () => {
    render(<StepIndicator {...defaultProps} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows checkmark for completed steps', () => {
    const { container } = render(
      <StepIndicator {...defaultProps} currentStep={3} stepProgress={2} />,
    )
    const checkmarks = container.querySelectorAll('path[d="M5 13l4 4L19 7"]')
    expect(checkmarks.length).toBe(2)
  })

  it('disables steps that cannot be proceeded to', () => {
    render(<StepIndicator {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[1]).toBeDisabled()
    expect(buttons[2]).toBeDisabled()
  })

  it('calls onStepClick when clicking enabled step', () => {
    const onStepClick = vi.fn()
    render(
      <StepIndicator {...defaultProps} onStepClick={onStepClick} canProceedToStep={() => true} />,
    )
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1])
    expect(onStepClick).toHaveBeenCalledWith(2)
  })

  it('renders step titles', () => {
    render(<StepIndicator {...defaultProps} />)
    expect(screen.getByText('Liên hệ')).toBeInTheDocument()
    expect(screen.getByText('Địa chỉ')).toBeInTheDocument()
    expect(screen.getByText('Chi tiết')).toBeInTheDocument()
  })

  it('renders connector lines between steps', () => {
    const { container } = render(<StepIndicator {...defaultProps} />)
    const connectors = container.querySelectorAll('.bg-gray-200')
    expect(connectors.length).toBe(2)
  })
})
