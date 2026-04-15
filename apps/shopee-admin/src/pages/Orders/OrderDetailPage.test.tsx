import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import OrderDetailPage from './OrderDetailPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 'order-1' }) }
})

describe('OrderDetailPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders loading state initially', () => {
    renderWithProviders(<OrderDetailPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders order content after loading', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.items')).toBeInTheDocument()
    expect(screen.getByText('detail.status')).toBeInTheDocument()
  })

  it('renders page header with order ID', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.back/i })).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/orders/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('renders customer info section', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.customer')).toBeInTheDocument()
  })
})
