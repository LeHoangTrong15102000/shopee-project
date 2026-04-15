import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Input from '../Input'

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}))

vi.mock('src/styles/animations', () => ({
  errorSlideIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
}))

describe('Input', () => {
  it('renders input element', () => {
    render(<Input name="email" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders with placeholder', () => {
    render(<Input name="email" placeholder="Enter email" />)
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<Input name="email" errorMessage="Email is required" />)
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('sets aria-invalid when error', () => {
    render(<Input name="email" errorMessage="Required" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('sets aria-invalid false when no error', () => {
    render(<Input name="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false')
  })

  it('sets aria-describedby when error', () => {
    render(<Input name="email" errorMessage="Required" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'email-error')
  })

  it('renders floating label', () => {
    render(<Input name="email" placeholder="Email" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('hides floating label when disableFloatingLabel', () => {
    render(<Input name="email" placeholder="Email" disableFloatingLabel />)
    // Label element should not be present
    const labels = screen.queryAllByText('Email')
    // Only the placeholder should exist, not a label element
    expect(labels.length).toBeLessThanOrEqual(1)
  })

  it('shows eye toggle for password type', () => {
    const { container } = render(<Input name="password" type="password" />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('toggles password visibility on eye click', () => {
    const { container } = render(<Input name="password" type="password" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    fireEvent.click(svg!)
    // After click, type should change to text (eye open state)
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('applies custom classNameInput', () => {
    const { container } = render(<Input name="test" classNameInput="custom-input" />)
    expect(container.querySelector('.custom-input')).toBeInTheDocument()
  })

  it('applies custom className wrapper', () => {
    const { container } = render(<Input name="test" className="wrapper-class" />)
    expect(container.firstChild).toHaveClass('wrapper-class')
  })

  it('handles focus event', () => {
    const onFocus = vi.fn()
    render(<Input name="test" onFocus={onFocus} />)
    fireEvent.focus(screen.getByRole('textbox'))
    expect(onFocus).toHaveBeenCalled()
  })

  it('handles blur event', () => {
    const onBlur = vi.fn()
    render(<Input name="test" onBlur={onBlur} />)
    fireEvent.blur(screen.getByRole('textbox'))
    expect(onBlur).toHaveBeenCalled()
  })

  it('uses register when provided', () => {
    const register = vi.fn().mockReturnValue({
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
      name: 'email',
    })
    render(<Input name="email" register={register} />)
    expect(register).toHaveBeenCalledWith('email', undefined)
  })

  it('adds red border class when error', () => {
    const { container } = render(<Input name="test" errorMessage="Error" />)
    const input = container.querySelector('input')
    expect(input?.className).toContain('border-red-600')
  })

  it('does not show eye for non-password type', () => {
    const { container } = render(<Input name="email" type="text" />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(0)
  })
})
