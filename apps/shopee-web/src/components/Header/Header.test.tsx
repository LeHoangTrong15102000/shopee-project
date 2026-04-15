import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/utils/testUtils'
import Header from './Header'

describe('Header', () => {
  it('renders search input', () => {
    renderWithProviders(<Header />)
    const searchInputs = screen.getAllByPlaceholderText('Tìm kiếm sản phẩm')
    expect(searchInputs.length).toBeGreaterThan(0)
    expect(searchInputs[0]).toBeInTheDocument()
  })

  it('renders Shopee logo link', () => {
    renderWithProviders(<Header />)
    const logoLinks = screen.getAllByRole('link')
    const homeLink = logoLinks.find((link) => link.getAttribute('href') === '/')
    expect(homeLink).toBeInTheDocument()
  })

  it('renders mobile hamburger menu button', () => {
    renderWithProviders(<Header />)
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('search input accepts user input', async () => {
    const { user } = renderWithProviders(<Header />)

    const searchInputs = screen.getAllByPlaceholderText('Tìm kiếm sản phẩm')
    await user.type(searchInputs[0], 'áo thun')

    expect(searchInputs[0]).toHaveValue('áo thun')
  })
})
