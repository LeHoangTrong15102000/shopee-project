import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LiveReviewFeed from '../LiveReviewFeed/LiveReviewFeed'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'reviews.stars': '{{count}} sao',
        'reviews.justReviewed': 'vừa đánh giá',
        'reviews.newReviews': 'đánh giá mới',
        'reviews.clickToView': 'Nhấn để xem',
      }

      if (key === 'reviews.stars' && params?.count !== undefined) {
        return `${params.count} sao`
      }

      return translations[key] || key
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

describe('LiveReviewFeed', () => {
  it('renders nothing when newReviewCount is 0', () => {
    const { container } = render(<LiveReviewFeed newReviewCount={0} />)

    expect(container.firstChild).toBeNull()
  })

  it('renders when there are new reviews', () => {
    const { container } = render(<LiveReviewFeed newReviewCount={5} />)

    expect(screen.getByText('5 đánh giá mới')).toBeInTheDocument()
  })

  it('displays new review count', () => {
    render(<LiveReviewFeed newReviewCount={5} />)

    expect(screen.getByText('5 đánh giá mới')).toBeInTheDocument()
  })

  it('displays latest review information', () => {
    const latestReview = {
      name: 'John Doe',
      rating: 5,
    }

    render(<LiveReviewFeed newReviewCount={5} latestReview={latestReview} />)

    expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    expect(screen.getByText(/vừa đánh giá/)).toBeInTheDocument()
  })

  it('renders star rating for latest review', () => {
    const latestReview = {
      name: 'John Doe',
      rating: 4,
    }

    render(<LiveReviewFeed newReviewCount={5} latestReview={latestReview} />)

    const stars = screen.getByText(/★★★★☆/)
    expect(stars).toBeInTheDocument()
  })

  it('calls onViewReviews when clicked', () => {
    const mockOnViewReviews = vi.fn()

    render(<LiveReviewFeed newReviewCount={5} onViewReviews={mockOnViewReviews} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockOnViewReviews).toHaveBeenCalledTimes(1)
  })

  it('handles keyboard Enter key', () => {
    const mockOnViewReviews = vi.fn()

    render(<LiveReviewFeed newReviewCount={5} onViewReviews={mockOnViewReviews} />)

    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Enter' })

    expect(mockOnViewReviews).toHaveBeenCalledTimes(1)
  })
})
