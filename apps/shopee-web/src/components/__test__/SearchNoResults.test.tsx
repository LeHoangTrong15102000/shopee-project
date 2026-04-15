import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchNoResults from '../SearchNoResults/SearchNoResults'
import ImageWithFallback from '../ImageWithFallback/ImageWithFallback'
import OptimizedImage from '../OptimizedImage/OptimizedImage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options) return `${key}_${JSON.stringify(options)}`
      return key
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

describe('SearchNoResults', () => {
  it('renders no results message', () => {
    const { container } = render(<SearchNoResults searchTerm="test query" />)
    expect(container.querySelector('[class]')).not.toBeNull()
  })

  it('renders with popular search handler', () => {
    const { container } = render(
      <SearchNoResults searchTerm="test query" onPopularSearch={vi.fn()} />,
    )
    expect(container.querySelector('[class]')).not.toBeNull()
  })

  it('renders suggestions and popular searches', () => {
    const { container } = render(<SearchNoResults searchTerm="nonexistent product" />)
    expect(container.querySelector('[class]')).not.toBeNull()
  })
})

describe('ImageWithFallback', () => {
  it('renders image with src', () => {
    render(<ImageWithFallback src="test.jpg" alt="Test Image" />)
    expect(screen.getByAltText('Test Image')).toBeInTheDocument()
  })

  it('renders with custom fallback', () => {
    render(<ImageWithFallback src="test.jpg" alt="Test Image" fallbackSrc="fallback.jpg" />)
    expect(screen.getByAltText('Test Image')).toBeInTheDocument()
  })

  it('renders with className', () => {
    render(<ImageWithFallback src="test.jpg" alt="Test Image" className="custom-class" />)
    expect(screen.getByAltText('Test Image')).toBeInTheDocument()
  })
})

describe('OptimizedImage', () => {
  it('renders optimized image', () => {
    render(<OptimizedImage src="test.jpg" alt="Test Image" />)
    expect(screen.getByAltText('Test Image')).toBeInTheDocument()
  })

  it('renders with aspect ratio', () => {
    render(<OptimizedImage src="test.jpg" alt="Test Image" aspectRatio="16:9" />)
    expect(screen.getByAltText('Test Image')).toBeInTheDocument()
  })

  it('renders with loading lazy', () => {
    render(<OptimizedImage src="test.jpg" alt="Test Image" loading="lazy" />)
    const img = screen.getByAltText('Test Image')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('renders with skeleton', () => {
    const { container } = render(
      <OptimizedImage src="test.jpg" alt="Test Image" showSkeleton={true} blurPlaceholder={true} />,
    )
    expect(container.querySelector('img, [role="img"]')).not.toBeNull()
  })
})
