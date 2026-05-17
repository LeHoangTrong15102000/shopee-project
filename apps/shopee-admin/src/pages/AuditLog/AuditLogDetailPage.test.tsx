import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import AuditLogDetailPage from './AuditLogDetailPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'audit-001' }),
  }
})

describe('AuditLogDetailPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders loading state initially', () => {
    renderWithProviders(<AuditLogDetailPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders metadata card after loading', async () => {
    renderWithProviders(<AuditLogDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders back button', async () => {
    renderWithProviders(<AuditLogDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /detail.back/i })).toBeInTheDocument()
  })

  it('navigates back to audit log list when back button clicked', async () => {
    const { user } = renderWithProviders(<AuditLogDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /detail.back/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/audit-log')
  })

  it('renders metadata labels', async () => {
    renderWithProviders(<AuditLogDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.id')).toBeInTheDocument()
    expect(screen.getByText('detail.actorId')).toBeInTheDocument()
    expect(screen.getByText('detail.ip')).toBeInTheDocument()
    expect(screen.getByText('detail.status')).toBeInTheDocument()
    expect(screen.getByText('detail.timestamp')).toBeInTheDocument()
  })

  it('shows error alert for failed entries with errorMessage', async () => {
    server.use(
      http.get(`${API_URL}/admin/audit-logs/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'audit-002',
            action: 'user.login',
            resource: 'user',
            resourceId: 'user-456',
            actor: { userId: 'user-456', roles: ['admin'] },
            ip: '198.51.100.5',
            status: 'failed',
            timestamp: '2024-01-01T10:00:00.000Z',
            errorMessage: 'Invalid credentials provided',
            before: null,
            after: null,
            diff: null,
          },
        })
      }),
    )
    renderWithProviders(<AuditLogDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('detail.errorMessage')).toBeInTheDocument()
      expect(screen.getByText('Invalid credentials provided')).toBeInTheDocument()
    })
  })

  it('does not show error alert for successful entries', async () => {
    renderWithProviders(<AuditLogDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('detail.errorMessage')).not.toBeInTheDocument()
  })

  it('renders diff viewer tabs when diff data is present', async () => {
    server.use(
      http.get(`${API_URL}/admin/audit-logs/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'audit-003',
            action: 'product.update',
            resource: 'product',
            resourceId: 'prod-789',
            actor: { userId: 'admin-001', roles: ['admin'] },
            ip: '10.0.0.1',
            status: 'success',
            timestamp: '2024-01-01T10:00:00.000Z',
            before: { name: 'iPhone 14', price: 25000000 },
            after: { name: 'iPhone 14', price: 23000000 },
            diff: [{ kind: 'E', path: ['price'], lhs: 25000000, rhs: 23000000 }],
          },
        })
      }),
    )
    renderWithProviders(<AuditLogDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /detail.diffTabs.before/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /detail.diffTabs.after/i })).toBeInTheDocument()
      expect(screen.getAllByRole('tab', { name: /detail.diffTabs.changes/i }).length).toBeGreaterThan(0)
    })
  })

  it('does not render diff viewer when no diff data', async () => {
    renderWithProviders(<AuditLogDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.queryByRole('tab', { name: /detail.diffTabs.before/i })).not.toBeInTheDocument()
  })

  it('shows ErrorState on 404', async () => {
    server.use(
      http.get(`${API_URL}/admin/audit-logs/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<AuditLogDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('notFound')).toBeInTheDocument()
    })
  })

  it('renders actor ID value from mock data', async () => {
    renderWithProviders(<AuditLogDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByText('user-123').length).toBeGreaterThan(0)
    })
  })
})
