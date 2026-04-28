import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ProductDetailPage from './ProductDetailPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 'prod-1' }) }
})

describe('ProductDetailPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders loading state initially', () => {
    renderWithProviders(<ProductDetailPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders product content after loading', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.details')).toBeInTheDocument()
    expect(screen.getByText('detail.info')).toBeInTheDocument()
  })

  it('renders back and edit buttons', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.back/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buttons.edit/i })).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/products/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('renders product image', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })

  it('renders product name in page header', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro Max')).toBeInTheDocument()
    })
  })

  it('renders product description', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Điện thoại cao cấp')).toBeInTheDocument()
    })
  })

  it('renders no description placeholder when description is absent', async () => {
    server.use(
      http.get(`${API_URL}/admin/products/:id`, () => {
        return HttpResponse.json({
          message: 'Thành công',
          data: {
            _id: 'prod-1',
            name: 'iPhone 15 Pro Max',
            price: 29990000,
            price_before_discount: 34990000,
            quantity: 200,
            sold: 150,
            rating: 4.5,
            category: { _id: 'cat-1', name: 'Điện thoại' },
            description: '',
            image: 'https://example.com/iphone.jpg',
            images: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            view: 100,
            location: 'HCM',
          },
        })
      }),
    )
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('states.noDescription')).toBeInTheDocument()
    })
  })

  it('renders price field', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.price')).toBeInTheDocument()
  })

  it('renders original price when price_before_discount is higher than price', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('detail.original')).toBeInTheDocument()
    })
  })

  it('does not render original price when no discount', async () => {
    server.use(
      http.get(`${API_URL}/admin/products/:id`, () => {
        return HttpResponse.json({
          message: 'Thành công',
          data: {
            _id: 'prod-1',
            name: 'iPhone 15 Pro Max',
            price: 29990000,
            price_before_discount: 29990000,
            quantity: 200,
            sold: 150,
            rating: 4.5,
            category: { _id: 'cat-1', name: 'Điện thoại' },
            description: 'Điện thoại cao cấp',
            image: 'https://example.com/iphone.jpg',
            images: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            view: 100,
            location: 'HCM',
          },
        })
      }),
    )
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('detail.price')).toBeInTheDocument()
    })
    expect(screen.queryByText('detail.original')).not.toBeInTheDocument()
  })

  it('renders stock quantity', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.stock')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('200')).toBeInTheDocument()
    })
  })

  it('renders sold count', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.sold')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument()
    })
  })

  it('renders rating badge', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.rating')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/4\.5\s*★/)).toBeInTheDocument()
    })
  })

  it('renders category name', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.category')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Điện thoại')).toBeInTheDocument()
    })
  })

  it('renders creation date', async () => {
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.created')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument()
    })
  })

  it('navigates back to /products when back button clicked', async () => {
    const { user } = renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.back/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/products')
  })

  it('navigates to edit page when edit button clicked', async () => {
    const { user } = renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.edit/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/products/prod-1/edit')
  })

  it('renders string category name correctly', async () => {
    server.use(
      http.get(`${API_URL}/admin/products/:id`, () => {
        return HttpResponse.json({
          message: 'Thành công',
          data: {
            _id: 'prod-1',
            name: 'iPhone 15 Pro Max',
            price: 29990000,
            price_before_discount: 34990000,
            quantity: 200,
            sold: 150,
            rating: 4.5,
            category: 'cat-1',
            description: 'Điện thoại cao cấp',
            image: 'https://example.com/iphone.jpg',
            images: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            view: 100,
            location: 'HCM',
          },
        })
      }),
    )
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('cat-1')).toBeInTheDocument()
    })
  })

  it('does not render image when product has no image', async () => {
    server.use(
      http.get(`${API_URL}/admin/products/:id`, () => {
        return HttpResponse.json({
          message: 'Thành công',
          data: {
            _id: 'prod-1',
            name: 'iPhone 15 Pro Max',
            price: 29990000,
            price_before_discount: 34990000,
            quantity: 200,
            sold: 150,
            rating: 4.5,
            category: { _id: 'cat-1', name: 'Điện thoại' },
            description: 'Điện thoại cao cấp',
            image: '',
            images: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            view: 100,
            location: 'HCM',
          },
        })
      }),
    )
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro Max')).toBeInTheDocument()
    })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
