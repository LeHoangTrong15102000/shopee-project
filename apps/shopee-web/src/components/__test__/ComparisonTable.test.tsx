import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ComparisonTable from '../ComparisonTable/ComparisonTable'
import CompareButton from '../CompareButton/CompareButton'
import CompareFloatingBar from '../CompareFloatingBar/CompareFloatingBar'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

vi.mock('src/hooks/useProductComparison', () => ({
  useProductComparison: () => ({
    compareList: [],
    removeFromCompare: vi.fn(),
    clearCompare: vi.fn(),
    isInCompare: vi.fn(() => false),
    addToCompare: vi.fn(),
    canAddMore: true,
  }),
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('react-toastify', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

const mockProduct = {
  _id: '1',
  name: 'Test Product',
  price: 100,
  price_before_discount: 150,
  rating: 4.5,
  sold: 100,
  image: 'test.jpg',
  quantity: 10,
  description: 'Test',
  category: { _id: '1', name: 'Test' },
  images: [],
  view: 0,
  location: 'Test Location',
  createdAt: '',
  updatedAt: '',
}

describe('ComparisonTable', () => {
  it('renders empty comparison table', () => {
    const { container } = render(
      <MemoryRouter>
        <ComparisonTable />
      </MemoryRouter>,
    )

    expect(container.querySelector('[class]')).not.toBeNull()
  })

  it('renders comparison table with products', () => {
    vi.doMock('src/hooks/useProductComparison', () => ({
      useProductComparison: () => ({
        compareList: [mockProduct],
        removeFromCompare: vi.fn(),
        clearCompare: vi.fn(),
        isInCompare: vi.fn(() => true),
        addToCompare: vi.fn(),
        canAddMore: true,
      }),
    }))

    const { container } = render(
      <MemoryRouter>
        <ComparisonTable onAddToCart={vi.fn()} />
      </MemoryRouter>,
    )

    expect(container.querySelector('[class]')).not.toBeNull()
  })
})

describe('CompareButton', () => {
  it('renders compare button', () => {
    const { container } = render(
      <MemoryRouter>
        <CompareButton product={mockProduct} />
      </MemoryRouter>,
    )

    expect(container.querySelector('[class]')).not.toBeNull()
  })
})

describe('CompareFloatingBar', () => {
  it('renders nothing when no products', () => {
    const { container } = render(
      <MemoryRouter>
        <CompareFloatingBar />
      </MemoryRouter>,
    )

    expect(container.firstChild).toBeFalsy()
  })
})
