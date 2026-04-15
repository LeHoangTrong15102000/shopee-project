import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import VoucherDetailPage from './VoucherDetailPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 'voucher-1' }) }
})

describe('VoucherDetailPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders loading state initially', () => {
    renderWithProviders(<VoucherDetailPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders voucher content after loading', async () => {
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.usageHistory')).toBeInTheDocument()
    expect(screen.getByText('detail.details')).toBeInTheDocument()
  })

  it('renders page header with voucher code', async () => {
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.back/i })).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/vouchers/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('renders voucher status info', async () => {
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.status')).toBeInTheDocument()
  })
})
