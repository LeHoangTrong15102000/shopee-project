import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/utils/testUtils'
import Footer from './Footer'

describe('Footer', () => {
  it('renders footer element', () => {
    renderWithProviders(<Footer />)
    expect(document.querySelector('footer')).toBeInTheDocument()
  })

  it('renders company name', () => {
    renderWithProviders(<Footer />)
    expect(screen.getByText('Công ty TNHH Shopee')).toBeInTheDocument()
  })

  it('renders policy links', () => {
    renderWithProviders(<Footer />)
    expect(screen.getByText(/chính sách bảo mật|privacy/i)).toBeInTheDocument()
  })

  it('renders country list', () => {
    renderWithProviders(<Footer />)
    expect(screen.getByText(/Singapore/)).toBeInTheDocument()
    // 'Việt Nam' appears in both country list and address, use getAllByText
    const vnElements = screen.getAllByText(/Việt Nam/)
    expect(vnElements.length).toBeGreaterThanOrEqual(1)
  })
})
