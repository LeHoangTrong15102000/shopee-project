import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/utils/testUtils'
import InputNumber from './InputNumber'

describe('InputNumber', () => {
  it('renders input element', () => {
    renderWithProviders(<InputNumber placeholder='Enter number' />)
    expect(screen.getByPlaceholderText('Enter number')).toBeInTheDocument()
  })

  it('accepts numeric input only', async () => {
    const handleChange = vi.fn()
    const { user } = renderWithProviders(<InputNumber onChange={handleChange} placeholder='Number' />)

    const input = screen.getByPlaceholderText('Number')
    await user.type(input, '123')

    expect(handleChange).toHaveBeenCalled()
    expect(input).toHaveValue('123')
  })

  it('does not call onChange for non-numeric characters', async () => {
    const handleChange = vi.fn()
    const { user } = renderWithProviders(<InputNumber onChange={handleChange} placeholder='Number' />)

    const input = screen.getByPlaceholderText('Number')
    await user.type(input, 'abc')

    expect(handleChange).not.toHaveBeenCalled()
  })

  it('shows error message when provided', () => {
    renderWithProviders(<InputNumber errorMessage='This field is required' placeholder='Number' />)

    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('respects maxValue prop', async () => {
    const { user } = renderWithProviders(<InputNumber maxValue='100' placeholder='Number' />)

    const input = screen.getByPlaceholderText('Number')
    await user.type(input, '150')

    expect(input).toHaveValue('100')
  })

  it('applies custom classNameInput', () => {
    renderWithProviders(<InputNumber classNameInput='custom-input-class' placeholder='Number' />)

    const input = screen.getByPlaceholderText('Number')
    expect(input).toHaveClass('custom-input-class')
  })
})
