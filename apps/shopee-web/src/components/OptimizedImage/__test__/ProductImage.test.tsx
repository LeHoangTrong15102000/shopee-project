import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductImage from '../ProductImage'

vi.mock('../OptimizedImage', () => ({
  default: ({ src, alt, containerClassName, className, fallbackSrc, aspectRatio, objectFit }: any) => (
    <div
      data-testid="optimized-image"
      data-container={containerClassName}
      data-class={className}
      data-fallback={fallbackSrc}
      data-aspect={aspectRatio}
      data-fit={objectFit}
    >
      <img src={src} alt={alt} />
    </div>
  ),
}))

describe('ProductImage', () => {
  it('renders with src and alt', () => {
    render(<ProductImage src="a.jpg" alt="Alt" />)
    expect(screen.getByAltText('Alt')).toHaveAttribute('src', 'a.jpg')
  })

  it('applies sm size class', () => {
    render(<ProductImage src="a.jpg" alt="a" size="sm" />)
    const el = screen.getByTestId('optimized-image')
    expect(el.getAttribute('data-container')).toContain('w-12')
    expect(el.getAttribute('data-container')).toContain('h-12')
  })

  it('applies md size class', () => {
    render(<ProductImage src="a.jpg" alt="a" size="md" />)
    expect(screen.getByTestId('optimized-image').getAttribute('data-container')).toContain(
      'w-20',
    )
  })

  it('applies lg size class', () => {
    render(<ProductImage src="a.jpg" alt="a" size="lg" />)
    expect(screen.getByTestId('optimized-image').getAttribute('data-container')).toContain(
      'w-32',
    )
  })

  it('does not apply size class when xl (default)', () => {
    render(<ProductImage src="a.jpg" alt="a" size="xl" />)
    const container = screen.getByTestId('optimized-image').getAttribute('data-container') || ''
    expect(container).not.toContain('w-12')
    expect(container).not.toContain('w-20')
    expect(container).not.toContain('w-32')
  })

  it('forces aspectRatio=1:1 and objectFit=cover', () => {
    render(<ProductImage src="a.jpg" alt="a" />)
    const el = screen.getByTestId('optimized-image')
    expect(el.getAttribute('data-aspect')).toBe('1:1')
    expect(el.getAttribute('data-fit')).toBe('cover')
  })

  it('uses default product fallback when fallbackSrc not provided', () => {
    render(<ProductImage src="a.jpg" alt="a" />)
    expect(screen.getByTestId('optimized-image').getAttribute('data-fallback')).toContain(
      'data:image/svg',
    )
  })

  it('accepts custom fallbackSrc', () => {
    render(<ProductImage src="a.jpg" alt="a" fallbackSrc="custom.png" />)
    expect(screen.getByTestId('optimized-image').getAttribute('data-fallback')).toBe(
      'custom.png',
    )
  })

  it('merges custom className', () => {
    render(<ProductImage src="a.jpg" alt="a" className="extra" />)
    expect(screen.getByTestId('optimized-image').getAttribute('data-class')).toContain('extra')
  })

  it('merges custom containerClassName with size class', () => {
    render(<ProductImage src="a.jpg" alt="a" size="sm" containerClassName="custom-c" />)
    const container = screen.getByTestId('optimized-image').getAttribute('data-container') || ''
    expect(container).toContain('custom-c')
    expect(container).toContain('w-12')
  })
})
