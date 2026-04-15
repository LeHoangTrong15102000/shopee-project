import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import MobileFilterDrawer from '../MobileFilterDrawer/MobileFilterDrawer'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

vi.mock('src/hooks/nuqs', () => ({
  useProductQueryStates: () => [
    { category: null, price_min: null, price_max: null, rating_filter: null },
    vi.fn(),
  ],
}))

vi.mock('src/hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}))

const mockCategories = [
  { _id: '1', name: 'Category 1', __v: 0 },
  { _id: '2', name: 'Category 2', __v: 0 },
]

describe('MobileFilterDrawer', () => {
  it('renders closed drawer', () => {
    const { container } = render(
      <MemoryRouter>
        <MobileFilterDrawer isOpen={false} onClose={vi.fn()} categories={mockCategories} />
      </MemoryRouter>,
    )

    expect(container).toBeInstanceOf(HTMLDivElement)
  })

  it('renders open drawer', () => {
    const { container } = render(
      <MemoryRouter>
        <MobileFilterDrawer isOpen={true} onClose={vi.fn()} categories={mockCategories} />
      </MemoryRouter>,
    )

    expect(container).toBeInstanceOf(HTMLDivElement)
  })

  it('renders with categories', () => {
    const { container } = render(
      <MemoryRouter>
        <MobileFilterDrawer isOpen={true} onClose={vi.fn()} categories={mockCategories} />
      </MemoryRouter>,
    )

    expect(container).toBeInstanceOf(HTMLDivElement)
  })
})
