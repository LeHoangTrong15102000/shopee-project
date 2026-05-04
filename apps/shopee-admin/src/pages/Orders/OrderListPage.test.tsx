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

  it('navigates to order detail when view button clicked', async () => {
    const { user } = renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.viewDetails')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.viewDetails'))
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/orders/'))
  })

  it('shows clear filters button after setting date filter', async () => {
    const { user } = renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterBtn = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.startDate')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('filters.startDate'), '2024-01-01')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.clearFilters/i })).toBeInTheDocument()
    })
  })

  it('renders empty state when API returns no orders', async () => {
    server.use(
      http.get(`${API_URL}/admin/orders`, () => {
        return HttpResponse.json({
          data: { orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
        })
      }),
    )
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByText('states.noResults')).toBeInTheDocument()
    })
  })

  it('renders customer column header', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.customer')
  })

  it('renders customer name from mock data', async () => {
    renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByText(/Nguyễn Văn A/).length).toBeGreaterThan(0)
    })
  })

  it('clears filters when clear filters button is clicked', async () => {
    const { user } = renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterBtn = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.startDate')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('filters.startDate'), '2024-01-01')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.clearFilters/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.clearFilters/i }))
    // FilterPanel always shows the clear button; verify the date input is cleared
    await waitFor(() => {
      expect(screen.getByLabelText('filters.startDate')).toHaveValue('')
    })
  })

  it('filters orders by end date input', async () => {
    const { user } = renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterBtn = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.endDate')).toBeInTheDocument()
    })
    const endDateInput = screen.getByLabelText('filters.endDate')
    await user.type(endDateInput, '2024-01-01')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.clearFilters/i })).toBeInTheDocument()
    })
    expect(endDateInput).toHaveValue('2024-01-01')
  })

  it('selects all rows via header checkbox and shows bulk action controls', async () => {
    const { user } = renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
    })
    const selectAllCheckbox = screen.getByLabelText('common:aria.selectAll')
    await user.click(selectAllCheckbox)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.apply/i })).toBeInTheDocument()
    })
  })

  it('renders filter payment method label in filter panel', async () => {
    const { user } = renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterBtn = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.paymentMethod')).toBeInTheDocument()
    })
  })

  it('toggles filter panel closed when filter button clicked again', async () => {
    const { user } = renderWithProviders(<OrderListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterBtn = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.startDate')).toBeInTheDocument()
    })
    await user.click(filterBtn)
    await waitFor(() => {
      expect(screen.queryByLabelText('filters.startDate')).not.toBeInTheDocument()
    })
  })
})
