import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import SaveForLaterSection from '../SaveForLaterSection/SaveForLaterSection'
import ShareButton from '../ShareButton/ShareButton'
import RecentlyViewed from '../RecentlyViewed/RecentlyViewed'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/utils/utils', () => ({
  formatCurrency: (value: number) => value.toString(),
  generateNameId: ({ name, id }: any) => `${name}-${id}`,
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
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
  viewedAt: '2024-01-01',
}

describe('SaveForLaterSection', () => {
  it('renders empty state', () => {
    const { container } = render(
      <MemoryRouter>
        <SaveForLaterSection
          savedItems={[]}
          onMoveToCart={vi.fn()}
          onRemove={vi.fn()}
          onClear={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('[class]')).not.toBeNull()
  })

  it('renders with saved items', () => {
    const savedItems: Array<{
      product: typeof mockProduct
      savedAt: string
      originalBuyCount: number
    }> = [{ product: mockProduct, savedAt: '2024-01-01', originalBuyCount: 1 }]
    render(
      <MemoryRouter>
        <SaveForLaterSection
          savedItems={savedItems}
          onMoveToCart={vi.fn()}
          onRemove={vi.fn()}
          onClear={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })
})

describe('ShareButton', () => {
  it('renders share button', () => {
    render(<ShareButton url="https://test.com" title="Test Title" />)
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1)
  })

  it('renders with description and image', () => {
    render(
      <ShareButton
        url="https://test.com"
        title="Test Title"
        description="Test Description"
        image="test.jpg"
      />,
    )
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1)
  })
})

describe('RecentlyViewed', () => {
  it('renders nothing when no products', () => {
    const { container } = render(
      <MemoryRouter>
        <RecentlyViewed products={[]} />
      </MemoryRouter>,
    )
    expect(container.firstChild).toBeFalsy()
  })

  it('renders with products', () => {
    render(
      <MemoryRouter>
        <RecentlyViewed products={[mockProduct]} />
      </MemoryRouter>,
    )
    expect(screen.getAllByText('Test Product').length).toBeGreaterThanOrEqual(1)
  })

  it('renders with max items limit', () => {
    const products = Array(15)
      .fill(mockProduct)
      .map((p, i) => ({ ...p, _id: `${i}` }))
    render(
      <MemoryRouter>
        <RecentlyViewed products={products} maxItems={5} />
      </MemoryRouter>,
    )
    // Component renders mobile + desktop layouts, so 5 products × 2 = 10 text nodes
    expect(screen.getAllByText('Test Product').length).toBeLessThanOrEqual(10)
  })
})
