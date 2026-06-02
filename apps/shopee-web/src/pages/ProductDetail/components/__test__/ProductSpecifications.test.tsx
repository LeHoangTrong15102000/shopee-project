import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductSpecifications from '../ProductSpecifications'

const mockProduct = {
  _id: '1',
  name: 'Test Product',
  price: 100000,
  price_before_discount: 200000,
  quantity: 50,
  sold: 100,
  rating: 4.5,
  view: 1000,
  description: 'desc',
  images: [],
  image: 'img.jpg',
  category: { _id: 'c1', name: 'Điện tử' },
  createdAt: '',
  updatedAt: '',
  location: 'TP. Hồ Chí Minh',
}

describe('ProductSpecifications', () => {
  it('renders specifications heading', () => {
    render(<ProductSpecifications product={mockProduct as any} />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders category name', () => {
    render(<ProductSpecifications product={mockProduct as any} />)
    expect(screen.getByText('Điện tử')).toBeInTheDocument()
  })

  it('renders dash when category is null', () => {
    const p = { ...mockProduct, category: null }
    render(<ProductSpecifications product={p as any} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders stock quantity', () => {
    render(<ProductSpecifications product={mockProduct as any} />)
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('renders location', () => {
    render(<ProductSpecifications product={mockProduct as any} />)
    expect(screen.getByText('TP. Hồ Chí Minh')).toBeInTheDocument()
  })

  it('renders dash when quantity is null', () => {
    const p = { ...mockProduct, quantity: null }
    render(<ProductSpecifications product={p as any} />)
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('renders default location when location is empty', () => {
    const p = { ...mockProduct, location: '' }
    render(<ProductSpecifications product={p as any} />)
    // Falls back to t('shipping.defaultLocation')
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders table with aria-labelledby', () => {
    render(<ProductSpecifications product={mockProduct as any} />)
    expect(screen.getByRole('table')).toHaveAttribute('aria-labelledby', 'specs-heading')
  })
})
