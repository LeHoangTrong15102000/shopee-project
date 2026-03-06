import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/utils/testUtils'
import NotFound from '../NotFound'

describe('NotFound', () => {
  it('renders 404 text', () => {
    renderWithProviders(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders Page Not Found message', () => {
    renderWithProviders(<NotFound />)
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
  })

  it('renders Go Home link', () => {
    renderWithProviders(<NotFound />)
    expect(screen.getByText('Go Home')).toBeInTheDocument()
  })

  it('Go Home link points to home page', () => {
    renderWithProviders(<NotFound />)
    const link = screen.getByText('Go Home').closest('a')
    expect(link).toHaveAttribute('href', '/')
  })
})
