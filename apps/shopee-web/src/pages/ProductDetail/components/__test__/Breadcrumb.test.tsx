import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Breadcrumb from '../Breadcrumb'

vi.mock('src/components/Breadcrumb', () => ({
  default: ({ items }: any) => (
    <div data-testid="shared-breadcrumb">
      {items.map((it: any, i: number) => (
        <span key={i} data-testid={`item-${i}`}>
          {it.label}|{it.to || ''}
        </span>
      ))}
    </div>
  ),
}))

describe('ProductDetail Breadcrumb', () => {
  it('passes 3 items: home, category, product', () => {
    render(<Breadcrumb categoryName="Phones" categoryId="c1" productName="iPhone" />)
    expect(screen.getByTestId('item-0')).toBeInTheDocument()
    expect(screen.getByTestId('item-1')).toBeInTheDocument()
    expect(screen.getByTestId('item-2')).toBeInTheDocument()
  })

  it('includes category name in second item', () => {
    render(<Breadcrumb categoryName="Phones" categoryId="c1" productName="iPhone" />)
    expect(screen.getByTestId('item-1').textContent).toContain('Phones')
  })

  it('includes product name as last item without link', () => {
    render(<Breadcrumb categoryName="Phones" categoryId="c1" productName="iPhone" />)
    const last = screen.getByTestId('item-2')
    expect(last.textContent).toContain('iPhone')
    expect(last.textContent?.endsWith('|')).toBe(true)
  })

  it('encodes categoryId in category URL', () => {
    render(<Breadcrumb categoryName="Phones" categoryId="abc123" productName="X" />)
    expect(screen.getByTestId('item-1').textContent).toContain('abc123')
  })

  it('renders shared breadcrumb component', () => {
    render(<Breadcrumb categoryName="C" categoryId="c" productName="P" />)
    expect(screen.getByTestId('shared-breadcrumb')).toBeInTheDocument()
  })
})
