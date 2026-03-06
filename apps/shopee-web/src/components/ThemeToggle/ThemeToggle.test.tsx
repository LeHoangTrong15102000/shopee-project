import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/utils/testUtils'
import ThemeToggle from './ThemeToggle'

describe('ThemeToggle', () => {
  it('renders toggle button', () => {
    renderWithProviders(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('has correct aria-label for accessibility', () => {
    renderWithProviders(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label')
  })

  it('applies custom className', () => {
    renderWithProviders(<ThemeToggle className='custom-class' />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('applies custom colorClassName', () => {
    renderWithProviders(<ThemeToggle colorClassName='text-red-500' />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-red-500')
  })
})
