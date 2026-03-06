import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import Breadcrumb from './Breadcrumb'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Breadcrumb', () => {
  const items = [{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }, { label: 'Current Page' }]

  it('renders all breadcrumb items', () => {
    renderWithRouter(<Breadcrumb items={items} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Current Page')).toBeInTheDocument()
  })

  it('renders links for items with to prop', () => {
    renderWithRouter(<Breadcrumb items={items} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products')
  })

  it('renders last item without link', () => {
    renderWithRouter(<Breadcrumb items={items} />)
    expect(screen.queryByRole('link', { name: 'Current Page' })).not.toBeInTheDocument()
  })

  it('has correct aria-label for navigation', () => {
    renderWithRouter(<Breadcrumb items={items} />)
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Breadcrumb')
  })
})
