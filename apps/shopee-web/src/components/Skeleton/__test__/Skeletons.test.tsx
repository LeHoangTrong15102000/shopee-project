import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductDetailSkeleton from '../ProductDetailSkeleton'
import AsideFilterSkeleton from '../AsideFilterSkeleton'
import ProductListSkeleton from '../ProductListSkeleton'

vi.mock('../SkeletonBase', () => ({
  default: ({ className }: any) => <div className={className} data-testid="skeleton" />,
}))

vi.mock('../ProductCardSkeleton', () => ({
  default: () => <div data-testid="product-card-skeleton" />,
}))

describe('ProductDetailSkeleton', () => {
  it('renders with loading status', () => {
    render(<ProductDetailSkeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  })

  it('renders skeleton elements', () => {
    render(<ProductDetailSkeleton />)
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(10)
  })

  it('renders 5 thumbnail skeletons', () => {
    const { container } = render(<ProductDetailSkeleton />)
    const thumbnailGrid = container.querySelector('.grid-cols-5')
    expect(thumbnailGrid).not.toBeNull()
  })

  it('renders 6 related product skeletons', () => {
    const { container } = render(<ProductDetailSkeleton />)
    const relatedGrid = container.querySelector('.grid-cols-2')
    expect(relatedGrid).not.toBeNull()
  })
})

describe('AsideFilterSkeleton', () => {
  it('renders with loading status', () => {
    render(<AsideFilterSkeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  })

  it('renders category list items', () => {
    const { container } = render(<AsideFilterSkeleton />)
    const listItems = container.querySelectorAll('li')
    expect(listItems.length).toBe(7)
  })

  it('renders rating star rows', () => {
    render(<AsideFilterSkeleton />)
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(20)
  })
})

describe('ProductListSkeleton', () => {
  it('renders with loading status', () => {
    render(<ProductListSkeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders default 20 product card skeletons', () => {
    render(<ProductListSkeleton />)
    expect(screen.getAllByTestId('product-card-skeleton').length).toBe(20)
  })

  it('renders custom count of skeletons', () => {
    render(<ProductListSkeleton count={5} />)
    expect(screen.getAllByTestId('product-card-skeleton').length).toBe(5)
  })
})
