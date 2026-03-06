import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkeletonBase, ProductCardSkeleton, CartItemSkeleton, NotificationSkeleton } from './index'

describe('Skeleton', () => {
  it('SkeletonBase renders with animate-pulse', () => {
    const { container } = render(<SkeletonBase />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('ProductCardSkeleton renders', () => {
    const { container } = render(<ProductCardSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('CartItemSkeleton renders', () => {
    const { container } = render(<CartItemSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('NotificationSkeleton renders', () => {
    const { container } = render(<NotificationSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
