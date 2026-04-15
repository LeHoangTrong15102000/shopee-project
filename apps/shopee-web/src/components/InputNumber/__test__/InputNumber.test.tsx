import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InputNumber from '../InputNumber'

describe('InputNumber', () => {
  it('renders input element', () => {
    render(<InputNumber />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('accepts numeric input and updates local value', () => {
    render(<InputNumber />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '123' } })
    expect(input).toHaveValue('123')
  })

  it('rejects non-numeric input', () => {
    render(<InputNumber value="5" />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'abc' } })
    // Value should remain unchanged since non-numeric is rejected
    expect(input).toHaveValue('5')
  })

  it('allows empty string', () => {
    render(<InputNumber />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue('')
  })

  it('clamps to maxValue', () => {
    render(<InputNumber maxValue="10" />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '20' } })
    expect(input).toHaveValue('10')
  })

  it('renders error message', () => {
    render(<InputNumber errorMessage="Required field" />)
    expect(screen.getByText('Required field')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<InputNumber className="wrapper" />)
    expect(container.firstChild).toHaveClass('wrapper')
  })

  it('applies custom classNameInput', () => {
    const { container } = render(<InputNumber classNameInput="custom-input" />)
    expect(container.querySelector('.custom-input')).toBeInTheDocument()
  })

  it('applies custom classNameError', () => {
    const { container } = render(<InputNumber classNameError="custom-error" errorMessage="err" />)
    expect(container.querySelector('.custom-error')).toBeInTheDocument()
  })

  it('uses value prop when provided', () => {
    render(<InputNumber value="42" />)
    expect(screen.getByRole('textbox')).toHaveValue('42')
  })

  it('forwards ref', () => {
    const ref = vi.fn()
    render(<InputNumber ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('passes rest props to input', () => {
    render(<InputNumber placeholder="Enter number" />)
    expect(screen.getByPlaceholderText('Enter number')).toBeInTheDocument()
  })
})
