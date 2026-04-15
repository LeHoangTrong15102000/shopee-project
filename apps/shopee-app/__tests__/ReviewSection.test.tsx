import React from 'react'
import { render } from '@testing-library/react-native'
import ReviewSection from '../components/product-detail/ReviewSection'
import type { Review, ReviewStats } from '../apis/product-detail.api'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'PD_RATING_BAR_LABEL') {
        return `${params.rating} stars: ${params.count} reviews (${params.percent}%)`
      }
      return key
    },
  }),
}))

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    warning: '#f4c790',
    neutrals400: '#6e6e6e',
    neutrals700: '#3a3a3a',
    neutrals800: '#2a2a2a',
  }),
}))

const mockReview: Review = {
  _id: 'r1',
  user: { _id: 'u1', name: 'John Doe', email: 'john@example.com' },
  product: { _id: 'p1', name: 'Product', image: 'img.jpg' },
  purchase: 'pur1',
  rating: 5,
  comment: 'Great product!',
  images: [],
  helpful_count: 10,
  is_liked: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const mockStats: ReviewStats = {
  total_reviews: 100,
  average_rating: 4.5,
  rating_breakdown: { 5: 60, 4: 20, 3: 10, 2: 5, 1: 5 },
}

describe('ReviewSection', () => {
  it('renders empty state when no reviews', () => {
    const { getByText } = render(
      <ReviewSection
        reviews={[]}
        stats={undefined}
        hasNextPage={false}
        onLoadMore={jest.fn()}
        onWriteReview={jest.fn()}
        onToggleLike={jest.fn()}
      />
    )
    expect(getByText('PD_NO_REVIEWS')).toBeTruthy()
  })

  it('renders review stats with rating breakdown', () => {
    const { getByText } = render(
      <ReviewSection
        reviews={[mockReview]}
        stats={mockStats}
        hasNextPage={false}
        onLoadMore={jest.fn()}
        onWriteReview={jest.fn()}
        onToggleLike={jest.fn()}
      />
    )
    expect(getByText('5 stars: 60 reviews (60%)')).toBeTruthy()
    expect(getByText('4 stars: 20 reviews (20%)')).toBeTruthy()
  })
})
