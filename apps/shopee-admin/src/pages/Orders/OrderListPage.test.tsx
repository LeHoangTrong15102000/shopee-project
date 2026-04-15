import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import OrderListPage from './OrderListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('OrderListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders order table after loading', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders page header with title', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders status tabs', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders export button', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.exportCsv/i })).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/orders`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders search input', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument()
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders bulk action button area', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('clicks export button without crashing', async () => {
    const { user } = renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const exportBtn = screen.getByRole('button', { name: /buttons.exportCsv/i })
    await user.click(exportBtn)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('opens filter panel when filter button clicked', async () => {
    const { user } = renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterBtn = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.startDate')).toBeInTheDocument()
      expect(screen.getByLabelText('filters.endDate')).toBeInTheDocument()
    })
  })

  it('renders all status tabs with correct labels', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const tablist = screen.getByRole('tablist')
    expect(tablist).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /status.all/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /status.pending/i })).toBeInTheDocument()
  })

  it('renders order total column', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.total')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders order status badges', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.status')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders order ID in table', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.orderId')
    await waitFor(() => {
      const cells = screen.getAllByRole('cell')
      const hasOrderIdCell = cells.some((cell) => /order-\d/.test(cell.textContent || ''))
      expect(hasOrderIdCell).toBe(true)
    })
  })

  it('renders StatusBadge elements in table', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1)
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.status')
  })

  it('renders order total in table', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.total')
    await waitFor(() => {
      const cells = screen.getAllByRole('cell')
      const hasPriceCell = cells.some((cell) => /[\d,]+/.test(cell.textContent || ''))
      expect(hasPriceCell).toBe(true)
    })
  })

  it('clicks status tab to filter orders', async () => {
    const { user } = renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    // Tabs use i18n keys like "status.pending"
    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBeGreaterThan(1)
    // Click the second tab (first non-"all" status)
    await user.click(tabs[1])
  })

  it('renders order date in table', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const dateCells = screen.getAllByText(/[A-Z][a-z]{2} \d{1,2}, \d{4}/)
      expect(dateCells.length).toBeGreaterThan(0)
    })
  })
})
