import React from 'react'
import { render } from '@testing-library/react-native'
import QASection from '../components/product-detail/QASection'
import type { Question } from '../apis/product-detail.api'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    neutrals700: '#3a3a3a',
    neutrals800: '#2a2a2a',
  }),
}))

const mockQuestion: Question = {
  _id: 'q1',
  product_id: 'p1',
  user_id: 'u1',
  user_name: 'John Doe',
  question: 'Is this product good?',
  answers: [],
  likes_count: 5,
  is_liked: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

describe('QASection', () => {
  it('renders empty state when no questions', () => {
    const { getByText } = render(
      <QASection
        questions={[]}
        hasNextPage={false}
        onLoadMore={jest.fn()}
        onAskQuestion={jest.fn()}
        onAnswerQuestion={jest.fn()}
        onToggleLike={jest.fn()}
        onToggleLikeAnswer={jest.fn()}
      />
    )
    expect(getByText('PD_NO_QUESTIONS')).toBeTruthy()
  })

  it('renders questions when provided', () => {
    const { getByText } = render(
      <QASection
        questions={[mockQuestion]}
        hasNextPage={false}
        onLoadMore={jest.fn()}
        onAskQuestion={jest.fn()}
        onAnswerQuestion={jest.fn()}
        onToggleLike={jest.fn()}
        onToggleLikeAnswer={jest.fn()}
      />
    )
    expect(getByText('Is this product good?')).toBeTruthy()
  })
})
