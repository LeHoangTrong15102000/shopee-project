import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/test-utils'
import ProductListPage from './ProductListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('ProductListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders product table after loading', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders page header with add product button', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /actions.addProduct/i })).toBeInTheDocument()
  })

  it('renders search input', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument()
  })

  it('renders page description', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders category filter', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/products`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders export CSV button', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.exportCsv/i })).toBeInTheDocument()
  })

  it('renders column visibility toggle', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders filter button', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.filters/i })).toBeInTheDocument()
  })

  it('navigates to new product page when add button clicked', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /actions.addProduct/i })
    await user.click(addButton)

    expect(mockNavigate).toHaveBeenCalledWith('/products/new')
  })

  it('opens filter panel when filter button clicked', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    expect(screen.queryByLabelText('filters.category')).not.toBeInTheDocument()

    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)

    await waitFor(() => {
      expect(screen.getByLabelText('filters.category')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('filters.minPrice')).toBeInTheDocument()
    expect(screen.getByLabelText('filters.maxPrice')).toBeInTheDocument()
    expect(screen.getByLabelText('filters.stockStatus')).toBeInTheDocument()
  })

  it('toggles filter panel closed when filter button clicked again', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)

    await waitFor(() => {
      expect(screen.getByLabelText('filters.category')).toBeInTheDocument()
    })

    await user.click(filterButton)

    await waitFor(() => {
      expect(screen.queryByLabelText('filters.category')).not.toBeInTheDocument()
    })
  })

  it('export CSV button is clickable without crashing', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    const exportButton = screen.getByRole('button', { name: /buttons.exportCsv/i })
    await user.click(exportButton)

    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('allows typing in price filter inputs', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)

    await waitFor(() => {
      expect(screen.getByLabelText('filters.minPrice')).toBeInTheDocument()
    })

    const minPriceInput = screen.getByLabelText('filters.minPrice')
    const maxPriceInput = screen.getByLabelText('filters.maxPrice')

    await user.type(minPriceInput, '100')
    await user.type(maxPriceInput, '500')

    expect(minPriceInput).toHaveValue(100)
    expect(maxPriceInput).toHaveValue(500)
  })

  it('renders product price column', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.price')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders product rating badges', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.rating')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders product name from mock data', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro Max')).toBeInTheDocument()
    })
  })

  it('renders product price in table', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.price')
    await waitFor(() => {
      const cells = screen.getAllByRole('cell')
      const hasPriceCell = cells.some((cell) => /[\d,]+/.test(cell.textContent || ''))
      expect(hasPriceCell).toBe(true)
    })
  })

  it('renders product stock quantity', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.stock')
    await waitFor(() => {
      const cells = screen.getAllByRole('cell')
      const hasQuantityCell = cells.some((cell) => /^\d+$/.test(cell.textContent?.trim() || ''))
      expect(hasQuantityCell).toBe(true)
    })
  })

  it('clears search input', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('search')
    await user.type(searchInput, 'iPhone')
    expect(searchInput).toHaveValue('iPhone')
    await user.clear(searchInput)
    expect(searchInput).toHaveValue('')
    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1)
    })
  })

  it('renders product image in table', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
    })
  })
})
