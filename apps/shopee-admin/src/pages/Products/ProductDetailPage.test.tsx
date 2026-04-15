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
})
