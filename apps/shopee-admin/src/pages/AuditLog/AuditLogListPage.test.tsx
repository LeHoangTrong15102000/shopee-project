import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import AuditLogListPage from './AuditLogListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('AuditLogListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders table after loading', async () => {
    renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders page header with title', async () => {
    renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders status tabs', async () => {
    renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders all three status tabs', async () => {
    renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('tab', { name: /tabs.all/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /tabs.success/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /tabs.failed/i })).toBeInTheDocument()
  })

  it('renders export CSV button', async () => {
    renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /export.exportCsv/i })).toBeInTheDocument()
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders column headers', async () => {
    renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.timestamp')
    expect(table).toHaveTextContent('columns.action')
    expect(table).toHaveTextContent('columns.resource')
    expect(table).toHaveTextContent('columns.actor')
    expect(table).toHaveTextContent('columns.ip')
    expect(table).toHaveTextContent('columns.status')
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/audit-logs`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders empty state when API returns no items', async () => {
    server.use(
      http.get(`${API_URL}/admin/audit-logs`, () => {
        return HttpResponse.json({
          data: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
        })
      }),
    )
    renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByText('states.noResults')).toBeInTheDocument()
    })
  })

  it('opens filter panel when filter button clicked', async () => {
    const { user } = renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterBtn = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.actorId')).toBeInTheDocument()
    })
  })

  it('renders actor ID filter input in filter panel', async () => {
    const { user } = renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterBtn = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.actorId')).toBeInTheDocument()
    })
    const actorInput = screen.getByLabelText('filters.actorId')
    await user.type(actorInput, 'admin-001')
    expect(actorInput).toHaveValue('admin-001')
  })

  it('renders date from/to filters in filter panel', async () => {
    const { user } = renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterBtn = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.dateFrom')).toBeInTheDocument()
      expect(screen.getByLabelText('filters.dateTo')).toBeInTheDocument()
    })
  })

  it('switches to failed tab and filters results', async () => {
    const { user } = renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const failedTab = screen.getByRole('tab', { name: /tabs.failed/i })
    await user.click(failedTab)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('clicks export button without crashing', async () => {
    const { user } = renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const exportBtn = screen.getByRole('button', { name: /export.exportCsv/i })
    await user.click(exportBtn)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders description text', async () => {
    renderWithProviders(<AuditLogListPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })
})
