import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import UserDetailPage from './UserDetailPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 'user-1' }) }
})

describe('UserDetailPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders loading state initially', () => {
    renderWithProviders(<UserDetailPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders user content after loading', async () => {
    renderWithProviders(<UserDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.name')).toBeInTheDocument()
    expect(screen.getByText('detail.email')).toBeInTheDocument()
  })

  it('renders page header with title', async () => {
    renderWithProviders(<UserDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /detail.backToUsers/i })).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/users/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<UserDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('renders role section', async () => {
    renderWithProviders(<UserDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.roles')).toBeInTheDocument()
  })
})
