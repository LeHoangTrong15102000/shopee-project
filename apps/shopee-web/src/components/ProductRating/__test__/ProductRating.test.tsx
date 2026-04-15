import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ProductRating from '../ProductRating'

describe('ProductRating', () => {
  it('renders 5 star containers', () => {
    const { container } = render(<ProductRating rating={3} />)
    const stars = container.querySelectorAll('.relative')
    expect(stars.length).toBe(5)
  })

  it('renders with role img', () => {
    render(<ProductRating rating={4.5} />)
    const el = document.querySelector('[role="img"]')
    expect(el).toBeInTheDocument()
  })

  it('has aria-label with rating', () => {
    render(<ProductRating rating={4.5} />)
    const el = document.querySelector('[role="img"]')
    expect(el).toHaveAttribute('aria-label', '4.5 out of 5 stars')
  })

  it('renders full stars for integer rating', () => {
    const { container } = render(<ProductRating rating={3} />)
    const overlays = container.querySelectorAll('.absolute.top-0')
    const fullStars = Array.from(overlays).filter(
      (el) => (el as HTMLElement).style.width === '100%',
    )
    expect(fullStars.length).toBe(3)
  })

  it('renders partial star for fractional rating', () => {
    const { container } = render(<ProductRating rating={3.5} />)
    const overlays = container.querySelectorAll('.absolute.top-0')
    const partialStars = Array.from(overlays).filter((el) => {
      const w = (el as HTMLElement).style.width
      return w !== '100%' && w !== '0%'
    })
    expect(partialStars.length).toBe(1)
  })

  it('renders empty stars for 0 rating', () => {
    const { container } = render(<ProductRating rating={0} />)
    const overlays = container.querySelectorAll('.absolute.top-0')
    const emptyStars = Array.from(overlays).filter((el) => (el as HTMLElement).style.width === '0%')
    expect(emptyStars.length).toBe(5)
  })

  it('renders all full stars for rating 5', () => {
    const { container } = render(<ProductRating rating={5} />)
    const overlays = container.querySelectorAll('.absolute.top-0')
    const fullStars = Array.from(overlays).filter(
      (el) => (el as HTMLElement).style.width === '100%',
    )
    expect(fullStars.length).toBe(5)
  })

  it('applies custom activeClassname', () => {
    const { container } = render(<ProductRating rating={3} activeClassname="custom-active" />)
    expect(container.querySelector('.custom-active')).toBeInTheDocument()
  })

  it('applies custom nonActiveClassname', () => {
    const { container } = render(<ProductRating rating={3} nonActiveClassname="custom-inactive" />)
    expect(container.querySelector('.custom-inactive')).toBeInTheDocument()
  })
})
